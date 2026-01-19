/**
 * Componente para mostrar una tarea individual
 */
import { useState } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  X, 
  Clock, 
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { Task } from '../types/task';
import {
  formatTaskDate,
  formatRelativeTime,
  formatDuration,
  getPriorityColor,
  getStatusColor,
  getStatusLabel,
  getPriorityLabel,
} from '../utils/task';

interface TaskItemProps {
  task: Task;
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onCancel: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isActive?: boolean;
}

export function TaskItem({
  task,
  onStart,
  onPause,
  onComplete,
  onCancel,
  onEdit,
  onDelete,
  isActive = false,
}: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const canStart = task.status === 'new';
  const canPause = task.status === 'active';
  const canComplete = task.status === 'active' || task.status === 'new';
  const canCancel = task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <Card className={`p-4 transition-all ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-lg truncate">{task.title}</h3>
            <Badge className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatRelativeTime(task.createdAt)}</span>
            </div>

            {task.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Est: {formatDuration(task.estimatedTime)}</span>
              </div>
            )}

            {task.actualTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Real: {formatDuration(task.actualTime)}</span>
              </div>
            )}
          </div>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Creada:</strong> {formatTaskDate(task.createdAt)}
                </div>
                {task.startedAt && (
                  <div>
                    <strong>Iniciada:</strong> {formatTaskDate(task.startedAt)}
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <strong>Completada:</strong> {formatTaskDate(task.completedAt)}
                  </div>
                )}
                {task.cancelledAt && (
                  <div>
                    <strong>Cancelada:</strong> {formatTaskDate(task.cancelledAt)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Botones de acción */}
          <div className="flex gap-1">
            {canStart && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStart(task.id)}
                className="text-green-600 hover:text-green-700"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}

            {canPause && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPause(task.id)}
                className="text-orange-600 hover:text-orange-700"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}

            {canComplete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete(task.id)}
                className="text-blue-600 hover:text-blue-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}

            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(task.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Botones secundarios */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(task.id)}
              className="text-gray-600 hover:text-gray-700"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Botón para mostrar/ocultar detalles */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-600 hover:text-gray-700"
          >
            {showDetails ? 'Menos' : 'Más'}
          </Button>
        </div>
      </div>
    </Card>
  );
}