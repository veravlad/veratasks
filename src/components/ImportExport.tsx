/**
 * Componente para importar y exportar tareas
 */
import { useState, useRef } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';

interface ImportExportProps {
  onExport: () => string;
  onImport: (data: string, replaceExisting?: boolean) => Promise<boolean>;
  tasksCount: number;
}

export function ImportExport({ onExport, onImport, tasksCount }: ImportExportProps) {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      setIsProcessing(true);
      const data = onExport();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `veratasks-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `${tasksCount} tarea(s) exportada(s) exitosamente`,
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Error al exportar las tareas',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsProcessing(true);
        const content = e.target?.result as string;
        const success = await onImport(content, importMode === 'replace');
        
        if (success) {
          setMessage({
            type: 'success',
            text: `Tareas importadas exitosamente (${importMode === 'replace' ? 'reemplazadas' : 'combinadas'})`,
          });
        } else {
          setMessage({
            type: 'error',
            text: 'Error al procesar el archivo. Verifique que sea un formato válido.',
          });
        }
      } catch {
        setMessage({
          type: 'error',
          text: 'Error al leer el archivo',
        });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  // Limpiar mensaje después de 5 segundos
  if (message && !isProcessing) {
    setTimeout(() => setMessage(null), 5000);
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Importar y Exportar</h2>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Sección de exportar */}
          <div className="space-y-3">
            <h3 className="font-medium">Exportar Tareas</h3>
            <p className="text-sm text-gray-600">
              Descarga todas tus tareas en formato JSON para crear una copia de seguridad.
            </p>
            <Button 
              onClick={handleExport}
              disabled={isProcessing || tasksCount === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isProcessing ? 'Exportando...' : `Exportar ${tasksCount} tarea(s)`}
            </Button>
          </div>

          <hr className="border-gray-200" />

          {/* Sección de importar */}
          <div className="space-y-3">
            <h3 className="font-medium">Importar Tareas</h3>
            <p className="text-sm text-gray-600">
              Carga un archivo JSON con tareas previamente exportadas.
            </p>

            {/* Modo de importación */}
            <div className="space-y-2">
              <Label>Modo de importación:</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Combinar con existentes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Reemplazar todas</span>
                </label>
              </div>
            </div>

            {/* Advertencia para modo reemplazar */}
            {importMode === 'replace' && tasksCount > 0 && (
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  ⚠️ Esto eliminará todas las {tasksCount} tarea(s) existentes y las reemplazará con las importadas.
                </span>
              </div>
            )}

            {/* Input de archivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
              disabled={isProcessing}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isProcessing ? 'Importando...' : 'Seleccionar archivo JSON'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Información adicional */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">💡 Consejos</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Los archivos exportados incluyen todo el historial de cambios de estado</li>
          <li>• Al importar en modo "combinar", las tareas mantienen sus IDs únicos</li>
          <li>• Recomendamos hacer exportaciones periódicas como respaldo</li>
          <li>• Los datos solo se almacenan en tu navegador (localStorage)</li>
        </ul>
      </Card>
    </div>
  );
}