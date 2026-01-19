/**
 * Hook para gestión de tareas con Supabase
 */
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type TaskRow, type TaskHistoryRow, type TaskInsert } from '../lib/supabase'
import type { Task, TaskStatus, ExportData } from '../types/task'
import type { CreateTaskData, UpdateTaskData } from '../schemas/task'
import { calculateTimeInMinutes } from '../utils/task'

// Simular user_id por ahora (en una app real vendría de autenticación)
const USER_ID = 'anonymous-user'

/**
 * Convierte TaskRow de Supabase a Task del frontend
 */
function mapTaskRowToTask(taskRow: TaskRow, history: TaskHistoryRow[] = []): Task {
  return {
    id: taskRow.id,
    title: taskRow.title,
    description: taskRow.description || undefined,
    priority: taskRow.priority,
    status: taskRow.status,
    estimatedTime: taskRow.estimated_time || undefined,
    actualTime: taskRow.actual_time || undefined,
    createdAt: new Date(taskRow.created_at),
    startedAt: taskRow.started_at ? new Date(taskRow.started_at) : undefined,
    completedAt: taskRow.completed_at ? new Date(taskRow.completed_at) : undefined,
    cancelledAt: taskRow.cancelled_at ? new Date(taskRow.cancelled_at) : undefined,
    statusHistory: history.map(h => ({
      status: h.status,
      changedAt: new Date(h.changed_at),
      timeInStatus: h.time_in_status || undefined,
    })),
  }
}

/**
 * Convierte Task del frontend a TaskInsert para Supabase
 */
function mapTaskToTaskInsert(task: Partial<Task>): Partial<TaskInsert> {
  return {
    id: task.id,
    user_id: USER_ID,
    title: task.title!,
    description: task.description || null,
    priority: task.priority!,
    status: task.status!,
    estimated_time: task.estimatedTime || null,
    actual_time: task.actualTime || null,
    created_at: task.createdAt?.toISOString(),
    started_at: task.startedAt?.toISOString() || null,
    completed_at: task.completedAt?.toISOString() || null,
    cancelled_at: task.cancelledAt?.toISOString() || null,
  }
}

export function useSupabaseTasks() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Query para obtener todas las tareas
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', USER_ID],
    queryFn: async () => {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false })

      if (taskError) throw taskError

      // Obtener historial para todas las tareas
      const taskIds = taskData.map(t => t.id)
      const { data: historyData, error: historyError } = await supabase
        .from('task_history')
        .select('*')
        .in('task_id', taskIds)
        .order('changed_at', { ascending: true })

      if (historyError) throw historyError

      // Agrupar historial por task_id
      const historyByTask = historyData.reduce((acc, history) => {
        if (!acc[history.task_id]) {
          acc[history.task_id] = []
        }
        acc[history.task_id].push(history)
        return acc
      }, {} as Record<string, TaskHistoryRow[]>)

      return taskData.map(task => mapTaskRowToTask(task, historyByTask[task.id] || []))
    },
  })

  // Mutation para crear tarea
  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const now = new Date()
      const taskId = crypto.randomUUID()
      
      const newTask: Task = {
        id: taskId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'new',
        estimatedTime: data.estimatedTime,
        createdAt: now,
        statusHistory: [
          {
            status: 'new',
            changedAt: now,
          },
        ],
      }

      // Insertar tarea
      const taskInsert = mapTaskToTaskInsert(newTask)
      const { error: taskError } = await supabase
        .from('tasks')
        .insert([taskInsert as TaskInsert])

      if (taskError) throw taskError

      // Insertar historial inicial
      const { error: historyError } = await supabase
        .from('task_history')
        .insert([{
          task_id: taskId,
          status: 'new',
          changed_at: now.toISOString(),
        }])

      if (historyError) throw historyError

      return newTask
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', USER_ID] })
    },
  })

  // Mutation para actualizar tarea
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskData }) => {
      const currentTask = tasks.find(t => t.id === taskId)
      if (!currentTask) throw new Error('Task not found')

      let updatedTask = { ...currentTask, ...data }
      const now = new Date()

      // Si el estado cambió, actualizar historial
      if (data.status && data.status !== currentTask.status) {
        // Actualizar tiempo del estado anterior
        if (currentTask.statusHistory.length > 0) {
          const lastHistory = currentTask.statusHistory[currentTask.statusHistory.length - 1]
          if (!lastHistory.timeInStatus) {
            const timeInStatus = calculateTimeInMinutes(lastHistory.changedAt, now)
            await supabase
              .from('task_history')
              .update({ time_in_status: timeInStatus })
              .eq('task_id', taskId)
              .eq('status', lastHistory.status)
              .eq('changed_at', lastHistory.changedAt.toISOString())
          }
        }

        // Agregar nuevo historial
        await supabase
          .from('task_history')
          .insert([{
            task_id: taskId,
            status: data.status,
            changed_at: now.toISOString(),
          }])

        // Actualizar timestamps según el nuevo estado
        switch (data.status) {
          case 'active':
            updatedTask = { ...updatedTask, startedAt: now }
            break
          case 'completed':
            updatedTask = { 
              ...updatedTask, 
              completedAt: now,
              actualTime: updatedTask.startedAt 
                ? calculateTimeInMinutes(updatedTask.startedAt, now)
                : updatedTask.actualTime
            }
            break
          case 'cancelled':
            updatedTask = { ...updatedTask, cancelledAt: now }
            break
        }
      }

      // Actualizar tarea
      const taskUpdate = {
        ...mapTaskToTaskInsert(updatedTask),
        updated_at: now.toISOString(),
      }
      const { error } = await supabase
        .from('tasks')
        .update(taskUpdate as Partial<TaskInsert>)
        .eq('id', taskId)

      if (error) throw error

      return updatedTask
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', USER_ID] })
    },
  })

  // Mutation para eliminar tarea
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Eliminar historial primero
      const { error: historyError } = await supabase
        .from('task_history')
        .delete()
        .eq('task_id', taskId)

      if (historyError) throw historyError

      // Eliminar tarea
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (taskError) throw taskError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', USER_ID] })
    },
  })

  // Funciones de conveniencia
  const createTask = useCallback((data: CreateTaskData) => {
    return createTaskMutation.mutateAsync(data)
  }, [createTaskMutation])

  const updateTask = useCallback((taskId: string, data: UpdateTaskData) => {
    return updateTaskMutation.mutateAsync({ taskId, data })
  }, [updateTaskMutation])

  const deleteTask = useCallback((taskId: string) => {
    deleteTaskMutation.mutate(taskId)
    if (activeTaskId === taskId) {
      setActiveTaskId(null)
    }
  }, [deleteTaskMutation, activeTaskId])

  const startTask = useCallback((taskId: string) => {
    // Solo puede haber una tarea activa a la vez
    if (activeTaskId && activeTaskId !== taskId) {
      updateTask(activeTaskId, { status: 'new' })
    }

    updateTask(taskId, { status: 'active' })
    setActiveTaskId(taskId)
  }, [activeTaskId, updateTask])

  const pauseTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'new' })
    if (activeTaskId === taskId) {
      setActiveTaskId(null)
    }
  }, [activeTaskId, updateTask])

  const completeTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'completed' })
    if (activeTaskId === taskId) {
      setActiveTaskId(null)
    }
  }, [activeTaskId, updateTask])

  const cancelTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'cancelled' })
    if (activeTaskId === taskId) {
      setActiveTaskId(null)
    }
  }, [activeTaskId, updateTask])

  const getTask = useCallback((taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId)
  }, [tasks])

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status)
  }, [tasks])

  // Exportar tareas (mantener compatibilidad con el formato anterior)
  const exportTasks = useCallback((): string => {
    const exportData: ExportData = {
      tasks,
      exportedAt: new Date(),
      version: '1.0.0',
    }

    return JSON.stringify(exportData, null, 2)
  }, [tasks])

  // Importar tareas desde JSON
  const importTasks = useCallback(async (jsonData: string, replaceExisting = false): Promise<boolean> => {
    try {
      const importData: ExportData = JSON.parse(jsonData)

      if (!importData.tasks || !Array.isArray(importData.tasks)) {
        throw new Error('Formato de datos inválido')
      }

      if (replaceExisting) {
        // Eliminar todas las tareas existentes
        const { error: deleteHistoryError } = await supabase
          .from('task_history')
          .delete()
          .in('task_id', tasks.map(t => t.id))

        if (deleteHistoryError) throw deleteHistoryError

        const { error: deleteTasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('user_id', USER_ID)

        if (deleteTasksError) throw deleteTasksError
      }

      // Insertar tareas importadas
      for (const task of importData.tasks) {
        const taskId = replaceExisting ? task.id : crypto.randomUUID()
        
        // Insertar tarea
        const taskData = {
          ...mapTaskToTaskInsert({ ...task, id: taskId }),
          user_id: USER_ID,
        }
        const { error: taskError } = await supabase
          .from('tasks')
          .insert([taskData as TaskInsert])

        if (taskError) throw taskError

        // Insertar historial
        for (const history of task.statusHistory) {
          const { error: historyError } = await supabase
            .from('task_history')
            .insert([{
              task_id: taskId,
              status: history.status,
              changed_at: history.changedAt.toISOString(),
              time_in_status: history.timeInStatus || null,
            }])

          if (historyError) throw historyError
        }
      }

      queryClient.invalidateQueries({ queryKey: ['tasks', USER_ID] })
      return true
    } catch (error) {
      console.error('Error importing tasks:', error)
      return false
    }
  }, [tasks, queryClient])

  const clearAllTasks = useCallback(async () => {
    // Eliminar historial primero
    const { error: historyError } = await supabase
      .from('task_history')
      .delete()
      .neq('id', '') // Eliminar todos

    if (historyError) throw historyError

    // Eliminar tareas
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', USER_ID)

    if (tasksError) throw tasksError

    setActiveTaskId(null)
    queryClient.invalidateQueries({ queryKey: ['tasks', USER_ID] })
  }, [queryClient])

  return {
    // Estado
    tasks,
    activeTaskId,
    isLoading,
    error,
    
    // Acciones CRUD
    createTask,
    updateTask,
    deleteTask,
    
    // Acciones de flujo de trabajo
    startTask,
    pauseTask,
    completeTask,
    cancelTask,
    
    // Utilidades
    getTask,
    getTasksByStatus,
    
    // Importar/Exportar
    exportTasks,
    importTasks,
    clearAllTasks,
  }
}