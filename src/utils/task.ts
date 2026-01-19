/**
 * Utilidades para cálculos de tareas y tiempo
 */
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task, TaskStats, TaskStatus, TaskPriority } from '../types/task';

/**
 * Calcula el tiempo transcurrido entre dos fechas en minutos
 */
export function calculateTimeInMinutes(startDate: Date, endDate?: Date): number {
  const end = endDate || new Date();
  return differenceInMinutes(end, startDate);
}

/**
 * Formatea una fecha para mostrar
 */
export function formatTaskDate(date: Date): string {
  return format(date, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
}

/**
 * Formatea el tiempo relativo desde una fecha
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

/**
 * Convierte minutos a formato legible (horas y minutos)
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calcula estadísticas completas de las tareas
 */
export function calculateTaskStats(tasks: Task[]): TaskStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  
  // Tiempo total activo (suma de tiempo de tareas completadas)
  const activeTime = tasks
    .filter(task => task.status === 'completed')
    .reduce((total, task) => total + (task.actualTime || 0), 0);
  
  // Tiempo promedio de completación
  const completedTasksWithTime = tasks.filter(
    task => task.status === 'completed' && task.actualTime
  );
  const averageCompletionTime = completedTasksWithTime.length > 0
    ? completedTasksWithTime.reduce((sum, task) => sum + (task.actualTime || 0), 0) / completedTasksWithTime.length
    : 0;
  
  // Tasa de completación
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Distribución por estado
  const statusDistribution = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);
  
  // Distribución por prioridad
  const priorityDistribution = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);
  
  // Tiempo promedio en cada estado
  const averageTimeInStatus = calculateAverageTimeInStatus(tasks);
  
  return {
    totalTasks,
    completedTasks,
    activeTime,
    averageCompletionTime,
    completionRate,
    statusDistribution,
    priorityDistribution,
    averageTimeInStatus,
  };
}

/**
 * Calcula el tiempo promedio que las tareas pasan en cada estado
 */
function calculateAverageTimeInStatus(tasks: Task[]): Record<TaskStatus, number> {
  const statusTimes: Record<TaskStatus, number[]> = {
    new: [],
    active: [],
    completed: [],
    cancelled: [],
  };
  
  tasks.forEach(task => {
    task.statusHistory.forEach(history => {
      if (history.timeInStatus) {
        statusTimes[history.status].push(history.timeInStatus);
      }
    });
  });
  
  const averages: Record<TaskStatus, number> = {
    new: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  };
  
  Object.keys(statusTimes).forEach(status => {
    const times = statusTimes[status as TaskStatus];
    if (times.length > 0) {
      averages[status as TaskStatus] = times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  });
  
  return averages;
}

/**
 * Actualiza el historial de estados de una tarea
 */
export function updateTaskStatusHistory(task: Task, newStatus: TaskStatus): Task {
  const now = new Date();
  const updatedHistory = [...task.statusHistory];
  
  // Si hay un estado anterior, calculamos el tiempo que estuvo en ese estado
  if (updatedHistory.length > 0) {
    const lastStatus = updatedHistory[updatedHistory.length - 1];
    if (!lastStatus.timeInStatus) {
      lastStatus.timeInStatus = calculateTimeInMinutes(lastStatus.changedAt, now);
    }
  }
  
  // Agregamos el nuevo estado
  updatedHistory.push({
    status: newStatus,
    changedAt: now,
  });
  
  return {
    ...task,
    statusHistory: updatedHistory,
  };
}

/**
 * Obtiene el color de prioridad para UI
 */
export function getPriorityColor(priority: TaskPriority): string {
  const colors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-red-600 bg-red-100',
  };
  return colors[priority];
}

/**
 * Obtiene el color de estado para UI
 */
export function getStatusColor(status: TaskStatus): string {
  const colors = {
    new: 'text-blue-600 bg-blue-100',
    active: 'text-orange-600 bg-orange-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-gray-600 bg-gray-100',
  };
  return colors[status];
}

/**
 * Obtiene la etiqueta en español para el estado
 */
export function getStatusLabel(status: TaskStatus): string {
  const labels = {
    new: 'Nueva',
    active: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  return labels[status];
}

/**
 * Obtiene la etiqueta en español para la prioridad
 */
export function getPriorityLabel(priority: TaskPriority): string {
  const labels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  };
  return labels[priority];
}