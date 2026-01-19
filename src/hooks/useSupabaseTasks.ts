/**
 * Hook para gestión de tareas con Supabase
 */
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type TaskRow, type TaskHistoryRow, type TaskInsert, type ProjectRow } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Task, TaskStatus } from '../types/task'
import type { CreateTaskData, UpdateTaskData } from '../schemas/task'
import { calculateTimeInMinutes } from '../utils/task'

/**
 * Convierte TaskRow de Supabase a Task del frontend
 */
function mapTaskRowToTask(taskRow: TaskRow, history: TaskHistoryRow[] = [], project?: ProjectRow): Task {
  return {
    id: taskRow.id,
    title: taskRow.title,
    description: taskRow.description || undefined,
    priority: taskRow.priority,
    status: taskRow.status,
    estimatedTime: taskRow.estimated_time || undefined,
    actualTime: taskRow.actual_time || undefined,
    projectId: taskRow.project_id || undefined,
    project: project ? {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      color: project.color,
      isArchived: project.is_archived,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    } : undefined,
    isArchived: taskRow.is_archived,
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
function mapTaskToTaskInsert(task: Partial<Task>, userId: string): Partial<TaskInsert> {
  return {
    id: task.id,
    user_id: userId,
    title: task.title!,
    description: task.description || null,
    priority: task.priority!,
    status: task.status!,
    estimated_time: task.estimatedTime || null,
    actual_time: task.actualTime || null,
    project_id: task.projectId || null,
    is_archived: task.isArchived || false,
    created_at: task.createdAt?.toISOString(),
    started_at: task.startedAt?.toISOString() || null,
    completed_at: task.completedAt?.toISOString() || null,
    cancelled_at: task.cancelledAt?.toISOString() || null,
  }
}

export function useSupabaseTasks(showArchived = false) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const userId = user?.id

  // Query para obtener todas las tareas
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', userId, showArchived],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated')
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects (
            id,
            name,
            description,
            color,
            is_archived,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
      
      // Filtrar por estado archivado
      if (!showArchived) {
        query = query.eq('is_archived', false)
      }
      
      const { data: taskData, error: taskError } = await query
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

      return taskData.map(task => {
        const projectData = Array.isArray(task.projects) ? task.projects[0] : task.projects
        return mapTaskRowToTask(task as TaskRow, historyByTask[task.id] || [], projectData as ProjectRow)
      })
    },
    enabled: !!userId, // Solo ejecutar query si el usuario está autenticado
  })

  // Mutation para crear tarea
  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!userId) throw new Error('User not authenticated')
      
      const now = new Date()
      const taskId = crypto.randomUUID()
      
      const newTask: Task = {
        id: taskId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'new',
        estimatedTime: data.estimatedTime,
        projectId: data.projectId,
        isArchived: false,
        createdAt: now,
        statusHistory: [
          {
            status: 'new',
            changedAt: now,
          },
        ],
      }

      // Insertar tarea
      const taskInsert = mapTaskToTaskInsert(newTask, userId)
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
      queryClient.invalidateQueries({ queryKey: ['tasks', userId, false] })
      queryClient.invalidateQueries({ queryKey: ['tasks', userId, true] })
    },
  })

  // Mutation para actualizar tarea
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskData }) => {
      if (!userId) throw new Error('User not authenticated')
      
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
        ...mapTaskToTaskInsert(updatedTask, userId),
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
      queryClient.invalidateQueries({ queryKey: ['tasks', userId, false] })
      queryClient.invalidateQueries({ queryKey: ['tasks', userId, true] })
    },
  })

  // Mutation para eliminar tarea
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userId) throw new Error('User not authenticated')
      
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
      queryClient.invalidateQueries({ queryKey: ['tasks', userId, false] })
      queryClient.invalidateQueries({ queryKey: ['tasks', userId, true] })
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

  const archiveTask = useCallback((taskId: string) => {
    updateTask(taskId, { isArchived: true })
    if (activeTaskId === taskId) {
      setActiveTaskId(null)
    }
  }, [activeTaskId, updateTask])

  const unarchiveTask = useCallback((taskId: string) => {
    updateTask(taskId, { isArchived: false })
  }, [updateTask])

  const getTask = useCallback((taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId)
  }, [tasks])

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status)
  }, [tasks])



  const clearAllTasks = useCallback(async () => {
    if (!userId) throw new Error('User not authenticated')
    
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
      .eq('user_id', userId)

    if (tasksError) throw tasksError

    setActiveTaskId(null)
    queryClient.invalidateQueries({ queryKey: ['tasks', userId, false] })
    queryClient.invalidateQueries({ queryKey: ['tasks', userId, true] })
  }, [queryClient, userId])

  return {
    // Estado
    tasks,
    activeTaskId,
    isLoading,
    error,
    
    // Estados de carga de mutations
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    
    // Acciones CRUD
    createTask,
    updateTask,
    deleteTask,
    
    // Acciones de flujo de trabajo
    startTask,
    pauseTask,
    completeTask,
    cancelTask,
    archiveTask,
    unarchiveTask,
    
    // Utilidades
    getTask,
    getTasksByStatus,
    clearAllTasks,
  }
}