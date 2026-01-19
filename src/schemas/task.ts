/**
 * Esquemas de validación con Zod para formularios
 */
import { z } from 'zod';

// Esquemas para proyectos
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(50, 'El nombre es muy largo'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser un código hexadecimal válido').default('#3b82f6'),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(50, 'El nombre es muy largo').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser un código hexadecimal válido').optional(),
  isArchived: z.boolean().optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100, 'El título es muy largo'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const),
  estimatedTime: z.number().min(1, 'El tiempo estimado debe ser mayor a 0').optional(),
  projectId: z.string().uuid('ID de proyecto inválido').optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100, 'El título es muy largo').optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const).optional(),
  estimatedTime: z.number().min(1, 'El tiempo estimado debe ser mayor a 0').optional(),
  status: z.enum(['new', 'active', 'completed', 'cancelled'] as const).optional(),
  projectId: z.string().uuid('ID de proyecto inválido').optional(),
});

export type CreateTaskData = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskData = z.infer<typeof UpdateTaskSchema>;
export type CreateProjectData = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectData = z.infer<typeof UpdateProjectSchema>;