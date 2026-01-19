/**
 * Hook personalizado para gestión de tareas
 */
import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Task, TaskStatus, ExportData } from '../types/task';
import type { CreateTaskData, UpdateTaskData } from '../schemas/task';
import { updateTaskStatusHistory, calculateTimeInMinutes } from '../utils/task';

const TASKS_STORAGE_KEY = 'veratasks-data';
const STORAGE_VERSION = '1.0.0';

/**
 * Hook principal para gestión de tareas
 */
export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(TASKS_STORAGE_KEY, []);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  /**
   * Crea una nueva tarea
   */
  const createTask = useCallback((data: CreateTaskData) => {
    const now = new Date();
    const newTask: Task = {
      id: crypto.randomUUID(),
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
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    return newTask;
  }, [setTasks]);

  /**
   * Actualiza una tarea existente
   */
  const updateTask = useCallback((taskId: string, data: UpdateTaskData) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id !== taskId) return task;

        let updatedTask = { ...task, ...data };

        // Si el estado cambió, actualizar historial
        if (data.status && data.status !== task.status) {
          updatedTask = updateTaskStatusHistory(updatedTask, data.status);

          // Actualizar timestamps según el nuevo estado
          const now = new Date();
          switch (data.status) {
            case 'active':
              updatedTask.startedAt = now;
              break;
            case 'completed':
              updatedTask.completedAt = now;
              if (updatedTask.startedAt) {
                updatedTask.actualTime = calculateTimeInMinutes(
                  updatedTask.startedAt,
                  now
                );
              }
              break;
            case 'cancelled':
              updatedTask.cancelledAt = now;
              break;
          }
        }

        return updatedTask;
      })
    );
  }, [setTasks]);

  /**
   * Elimina una tarea
   */
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  }, [setTasks, activeTaskId]);

  /**
   * Inicia una tarea (cambia estado a 'active')
   */
  const startTask = useCallback((taskId: string) => {
    // Solo puede haber una tarea activa a la vez
    if (activeTaskId && activeTaskId !== taskId) {
      updateTask(activeTaskId, { status: 'new' });
    }

    updateTask(taskId, { status: 'active' });
    setActiveTaskId(taskId);
  }, [activeTaskId, updateTask]);

  /**
   * Pausa una tarea activa (cambia estado a 'new')
   */
  const pauseTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'new' });
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  }, [activeTaskId, updateTask]);

  /**
   * Completa una tarea
   */
  const completeTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'completed' });
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  }, [activeTaskId, updateTask]);

  /**
   * Cancela una tarea
   */
  const cancelTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'cancelled' });
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  }, [activeTaskId, updateTask]);

  /**
   * Exporta las tareas a JSON
   */
  const exportTasks = useCallback((): string => {
    const exportData: ExportData = {
      tasks,
      exportedAt: new Date(),
      version: STORAGE_VERSION,
    };

    return JSON.stringify(exportData, null, 2);
  }, [tasks]);

  /**
   * Importa tareas desde JSON
   */
  const importTasks = useCallback((jsonData: string, replaceExisting = false): boolean => {
    try {
      const importData: ExportData = JSON.parse(jsonData);

      // Validar estructura básica
      if (!importData.tasks || !Array.isArray(importData.tasks)) {
        throw new Error('Formato de datos inválido');
      }

      // Convertir fechas de string a Date objects
      const importedTasks: Task[] = importData.tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        cancelledAt: task.cancelledAt ? new Date(task.cancelledAt) : undefined,
        statusHistory: task.statusHistory.map(history => ({
          ...history,
          changedAt: new Date(history.changedAt),
        })),
      }));

      if (replaceExisting) {
        setTasks(importedTasks);
      } else {
        // Generar nuevos IDs para evitar duplicados
        const tasksWithNewIds = importedTasks.map(task => ({
          ...task,
          id: crypto.randomUUID(),
        }));
        setTasks(prevTasks => [...prevTasks, ...tasksWithNewIds]);
      }

      return true;
    } catch (error) {
      console.error('Error importing tasks:', error);
      return false;
    }
  }, [setTasks]);

  /**
   * Limpia todas las tareas
   */
  const clearAllTasks = useCallback(() => {
    setTasks([]);
    setActiveTaskId(null);
  }, [setTasks]);

  /**
   * Obtiene una tarea por ID
   */
  const getTask = useCallback((taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  /**
   * Filtra tareas por estado
   */
  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  return {
    // Estado
    tasks,
    activeTaskId,
    
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
  };
}