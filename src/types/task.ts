/**
 * Tipos para la gestión de tareas
 */

export type TaskStatus = 'new' | 'active' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  completionRate: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedTime?: number; // en minutos
  actualTime?: number; // tiempo real en minutos
  projectId?: string;
  project?: Project;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  statusHistory: TaskStatusHistory[];
}

export interface TaskStatusHistory {
  status: TaskStatus;
  changedAt: Date;
  timeInStatus?: number; // tiempo en este estado en minutos
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  activeTime: number; // tiempo total activo en minutos
  averageCompletionTime: number;
  completionRate: number; // porcentaje
  statusDistribution: Record<TaskStatus, number>;
  priorityDistribution: Record<TaskPriority, number>;
  averageTimeInStatus: Record<TaskStatus, number>;
}