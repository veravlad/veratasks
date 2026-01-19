/**
 * Dashboard de estadísticas y análisis de rendimiento
 */
import { useMemo } from 'react';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import { Card } from './ui/card';
import type { Task } from '../types/task';
import { calculateTaskStats, formatDuration } from '../utils/task';
import type { LucideIcon } from 'lucide-react';

interface TaskStatsProps {
  tasks: Task[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue' 
}: StatCardProps) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </Card>
);

export function TaskStats({ tasks }: TaskStatsProps) {
  const stats = useMemo(() => calculateTaskStats(tasks), [tasks]);

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Tareas"
            value={stats.totalTasks}
            icon={BarChart3}
            color="blue"
          />
          <StatCard
            title="Completadas"
            value={stats.completedTasks}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Tiempo Activo"
            value={formatDuration(stats.activeTime)}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Tasa de Completación"
            value={`${stats.completionRate.toFixed(1)}%`}
            icon={Target}
            color="purple"
          />
        </div>
      </div>

      {/* Métricas de rendimiento */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Rendimiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Tiempo Promedio de Completación</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {formatDuration(stats.averageCompletionTime)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Por tarea completada
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold">Tiempo Promedio por Estado</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Nueva:</span>
                <span className="text-sm font-medium">
                  {formatDuration(stats.averageTimeInStatus.new)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">En Progreso:</span>
                <span className="text-sm font-medium">
                  {formatDuration(stats.averageTimeInStatus.active)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Distribución por estado */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Distribución por Estado</h2>
        <Card className="p-4">
          <div className="space-y-3">
            {Object.entries(stats.statusDistribution).map(([status, count]) => {
              const percentage = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
              const statusLabels = {
                new: 'Nuevas',
                active: 'En Progreso',
                completed: 'Completadas',
                cancelled: 'Canceladas',
              };
              const colors = {
                new: 'bg-blue-500',
                active: 'bg-orange-500',
                completed: 'bg-green-500',
                cancelled: 'bg-gray-500',
              };

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{statusLabels[status as keyof typeof statusLabels]}</span>
                    <span>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        colors[status as keyof typeof colors]
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Distribución por prioridad */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Distribución por Prioridad</h2>
        <Card className="p-4">
          <div className="space-y-3">
            {Object.entries(stats.priorityDistribution).map(([priority, count]) => {
              const percentage = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
              const priorityLabels = {
                low: 'Baja',
                medium: 'Media',
                high: 'Alta',
              };
              const colors = {
                low: 'bg-green-500',
                medium: 'bg-yellow-500',
                high: 'bg-red-500',
              };

              return (
                <div key={priority} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{priorityLabels[priority as keyof typeof priorityLabels]}</span>
                    <span>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        colors[priority as keyof typeof colors]
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}