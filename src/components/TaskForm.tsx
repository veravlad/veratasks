/**
 * Formulario para crear y editar tareas
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { CreateTaskSchema, UpdateTaskSchema, type CreateTaskData, type UpdateTaskData } from '../schemas/task';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import type { Task } from '../types/task';

interface TaskFormProps {
  onSubmit: (data: CreateTaskData | UpdateTaskData) => void;
  onCancel?: () => void;
  onDelete?: (taskId: string) => void;
  isOpen?: boolean;
  editingTask?: Task;
}

export function TaskForm({ onSubmit, onCancel, onDelete, isOpen = true, editingTask }: TaskFormProps) {
  const isEditing = !!editingTask;
  const schema = isEditing ? UpdateTaskSchema : CreateTaskSchema;
  const { projects } = useSupabaseProjects();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskData | UpdateTaskData>({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? {
      title: editingTask.title,
      description: editingTask.description || '',
      priority: editingTask.priority,
      estimatedTime: editingTask.estimatedTime,
      projectId: editingTask.projectId || undefined,
    } : {
      title: '',
      description: '',
      priority: 'medium',
      projectId: undefined,
    },
  });

  const handleFormSubmit = (data: CreateTaskData | UpdateTaskData) => {
    onSubmit(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        {isEditing ? (
          <>
            <Edit3 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Editar Tarea</h2>
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Nueva Tarea</h2>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Título de la tarea..."
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Descripción opcional..."
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId">Proyecto</Label>
          <select
            id="projectId"
            {...register('projectId')}
            className="px-3 py-2 border rounded-md text-sm w-full"
          >
            <option value="">Sin proyecto</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.projectId && (
            <p className="text-sm text-red-600">{errors.projectId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <select
              id="priority"
              {...register('priority')}
              className="px-3 py-2 border rounded-md text-sm w-full"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
            {errors.priority && (
              <p className="text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Tiempo Estimado (min)</Label>
            <Input
              id="estimatedTime"
              type="number"
              min="1"
              {...register('estimatedTime', { valueAsNumber: true })}
              placeholder="60"
            />
            {errors.estimatedTime && (
              <p className="text-sm text-red-600">{errors.estimatedTime.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Tarea' : 'Crear Tarea')}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          {isEditing && onDelete && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => {
                if (confirm('¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.')) {
                  onDelete(editingTask!.id)
                }
              }}
              className="ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}