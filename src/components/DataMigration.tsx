/**
 * Componente para migrar datos de localStorage a Supabase
 */
import { useState } from 'react';
import { Database, Upload, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSupabaseTasks } from '../hooks/useSupabaseTasks';
import type { Task } from '../types/task';

export function DataMigration() {
  const [localTasks] = useLocalStorage<Task[]>('veratasks-data', []);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { importTasks, tasks: supabaseTasks } = useSupabaseTasks();

  const handleMigration = async () => {
    if (localTasks.length === 0) {
      setError('No hay datos en localStorage para migrar');
      return;
    }

    try {
      setMigrationStatus('migrating');
      setError(null);

      // Crear el JSON de exportación
      const exportData = {
        tasks: localTasks,
        exportedAt: new Date(),
        version: '1.0.0',
      };

      const jsonData = JSON.stringify(exportData);
      const success = await importTasks(jsonData, false); // No reemplazar, combinar

      if (success) {
        setMigrationStatus('success');
      } else {
        throw new Error('Error durante la migración');
      }
    } catch (err) {
      setMigrationStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const hasLocalData = localTasks.length > 0;
  const hasSupabaseData = supabaseTasks.length > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Migración de Datos</h2>
      </div>

      <div className="space-y-4">
        {/* Estado actual */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-900">localStorage</div>
            <div className="text-2xl font-bold text-blue-600">{localTasks.length}</div>
            <div className="text-sm text-blue-700">tareas locales</div>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-900">Supabase</div>
            <div className="text-2xl font-bold text-green-600">{supabaseTasks.length}</div>
            <div className="text-sm text-green-700">tareas en la nube</div>
          </div>
        </div>

        {/* Mensaje según el estado */}
        {!hasLocalData && !hasSupabaseData && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay datos que migrar. Comienza creando algunas tareas.</p>
          </div>
        )}

        {hasLocalData && !hasSupabaseData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Migración Recomendada</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Tienes {localTasks.length} tarea(s) en localStorage. Te recomendamos migrarlas a Supabase 
                  para tener respaldo en la nube y sincronización entre dispositivos.
                </p>
              </div>
            </div>
          </div>
        )}

        {!hasLocalData && hasSupabaseData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">¡Ya estás usando Supabase!</p>
                <p className="text-sm text-green-800 mt-1">
                  Tus {supabaseTasks.length} tarea(s) están respaldadas en la nube.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasLocalData && hasSupabaseData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Database className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Datos en Ambos Lugares</p>
                <p className="text-sm text-blue-800 mt-1">
                  Tienes datos tanto en localStorage como en Supabase. 
                  Puedes migrar las tareas locales para combinarlas con las de la nube.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes de estado de migración */}
        {migrationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-medium text-green-900">¡Migración Exitosa!</p>
            </div>
            <p className="text-sm text-green-800 mt-1">
              Tus tareas han sido migradas a Supabase exitosamente.
            </p>
          </div>
        )}

        {migrationStatus === 'error' && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="font-medium text-red-900">Error en la Migración</p>
            </div>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        )}

        {/* Botón de migración */}
        {hasLocalData && migrationStatus !== 'success' && (
          <div className="pt-4">
            <Button
              onClick={handleMigration}
              disabled={migrationStatus === 'migrating'}
              className="w-full"
            >
              {migrationStatus === 'migrating' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Migrando datos...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Migrar {localTasks.length} tarea(s) a Supabase
                </>
              )}
            </Button>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">💡 ¿Qué hace la migración?</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Copia todas las tareas de localStorage a Supabase</li>
            <li>• Preserva todo el historial de cambios de estado</li>
            <li>• Mantiene las tareas locales intactas (no las borra)</li>
            <li>• Combina datos si ya tienes tareas en Supabase</li>
            <li>• Una vez migrado, la app usará Supabase como fuente principal</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}