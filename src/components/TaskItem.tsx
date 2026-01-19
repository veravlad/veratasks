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
  Trash2,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Loader2
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
  onArchive: (taskId: string) => void;
  onUnarchive?: (taskId: string) => void;
  isActive?: boolean;
  isLoading?: boolean;
  pendingOperations?: Set<string>;
}

export function TaskItem({
  task,
  onStart,
  onPause,
  onComplete,
  onCancel,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  isActive = false,
  isLoading = false,
  pendingOperations = new Set(),
}: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const canStart = task.status === 'new';
  const canPause = task.status === 'active';
  const canComplete = task.status === 'active' || task.status === 'new';
  const canCancel = task.status !== 'completed' && task.status !== 'cancelled';

  // Verificar si hay operaciones pendientes para esta tarea
  const isTaskPending = pendingOperations.has(task.id);
  const isAnyOperationPending = isLoading || isTaskPending;

  return (
    <Card className={`p-4 transition-all ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${isAnyOperationPending ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {isAnyOperationPending && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            )}
            <h3 className="font-medium text-lg truncate">{task.title}</h3>
            <Badge className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {getPriorityLabel(task.priority)}
            </Badge>
            {task.project && (
              <Badge 
                className="text-white"
                style={{ backgroundColor: task.project.color }}
              >
                {task.project.name}
              </Badge>
            )}
            {task.isArchived && (
              <Badge className="bg-gray-500 text-white">
                Archivada
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Azure DevOps Board Link */}
          {task.project?.azureDevOpsBoardUrl && (
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(task.project!.azureDevOpsBoardUrl, '_blank')
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-200"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir en Azure DevOps
              </button>
            </div>
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
                disabled={isAnyOperationPending}
                className="text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}

            {canPause && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPause(task.id)}
                disabled={isAnyOperationPending}
                className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}

            {canComplete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete(task.id)}
                disabled={isAnyOperationPending}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}

            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(task.id)}
                disabled={isAnyOperationPending}
                className="text-red-600 hover:text-red-700 disabled:opacity-50"
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
              disabled={isAnyOperationPending}
              className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
            >
              <Edit className="w-4 h-4" />
            </Button>

            {task.isArchived ? (
              onUnarchive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUnarchive(task.id)}
                  disabled={isAnyOperationPending}
                  className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  title="Desarchivar"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </Button>
              )
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onArchive(task.id)}
                disabled={isAnyOperationPending}
                className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
                title="Archivar"
              >
                <Archive className="w-4 h-4" />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(task.id)}
              disabled={isAnyOperationPending}
              className="text-red-600 hover:text-red-700 disabled:opacity-50"
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