/**
 * Lista de tareas con filtros y ordenación
 */
import { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { TaskItem } from './TaskItem';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import type { Task, TaskStatus, TaskPriority } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onCancel: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

type SortOption = 'created' | 'priority' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';

export function TaskList({
  tasks,
  activeTaskId,
  onStart,
  onPause,
  onComplete,
  onCancel,
  onEdit,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { projects } = useSupabaseProjects();

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filtro por prioridad
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Filtro por proyecto
    if (projectFilter !== 'all') {
      if (projectFilter === 'none') {
        filtered = filtered.filter(task => !task.projectId);
      } else {
        filtered = filtered.filter(task => task.projectId === projectFilter);
      }
    }

    // Ordenación
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'created': {
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        }
        case 'title': {
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        }
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        }
        case 'status': {
          const statusOrder = { active: 4, new: 3, completed: 2, cancelled: 1 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        }
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter, sortBy, sortDirection]);

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-4">
      {/* Controles de filtro y búsqueda */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros y ordenación */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="new">Nueva</option>
                <option value="active">En Progreso</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas las prioridades</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            <div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos los proyectos</option>
                <option value="none">Sin proyecto</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="created">Fecha de creación</option>
                <option value="title">Título</option>
                <option value="priority">Prioridad</option>
                <option value="status">Estado</option>
              </select>

              <Button
                size="sm"
                variant="outline"
                onClick={toggleSort}
                className="px-2"
              >
                {sortDirection === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-2 text-sm text-gray-600">
          {filteredAndSortedTasks.length} tarea(s) 
          {tasks.length !== filteredAndSortedTasks.length && ` de ${tasks.length} total`}
        </div>
      </div>

      {/* Lista de tareas */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? (
            <>
              <p className="text-lg mb-2">No se encontraron tareas</p>
              <p>Prueba ajustar los filtros de búsqueda</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">No hay tareas aún</p>
              <p>¡Crea tu primera tarea para comenzar!</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              isLoading={isUpdating || isDeleting}
              onStart={onStart}
              onPause={onPause}
              onComplete={onComplete}
              onCancel={onCancel}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}