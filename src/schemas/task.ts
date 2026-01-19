/**
 * Esquemas de validación con Zod para formularios
 */
import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100, 'El título es muy largo'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const).default('medium'),
  estimatedTime: z.number().min(1, 'El tiempo estimado debe ser mayor a 0').optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100, 'El título es muy largo').optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const).optional(),
  estimatedTime: z.number().min(1, 'El tiempo estimado debe ser mayor a 0').optional(),
  status: z.enum(['new', 'active', 'completed', 'cancelled'] as const).optional(),
});

export type CreateTaskData = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskData = z.infer<typeof UpdateTaskSchema>;