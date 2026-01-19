/**
 * Componente principal de la aplicación de gestión de tareas
 */
import { useState } from 'react'
import { 
  ListTodo, 
  Plus, 
  BarChart3, 
  FileText,
  PlayCircle,
  PauseCircle,
  LogOut
} from 'lucide-react'
import { Button } from './components/ui/button'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import { TaskStats } from './components/TaskStats'
import { ImportExport } from './components/ImportExport'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useSupabaseTasks } from './hooks/useSupabaseTasks'
import { useAuthStore } from './stores/authStore'
import type { CreateTaskData } from './schemas/task'
import type { LucideIcon } from 'lucide-react'

type View = 'tasks' | 'stats' | 'import-export'

interface NavigationButtonProps {
  view: View;
  icon: LucideIcon;
  label: string;
  count?: number;
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavigationButton = ({ 
  view, 
  icon: Icon, 
  label, 
  count,
  currentView,
  onViewChange
}: NavigationButtonProps) => (
  <Button
    variant={currentView === view ? 'default' : 'ghost'}
    onClick={() => onViewChange(view)}
    className="flex items-center gap-2 justify-start"
  >
    <Icon className="w-4 h-4" />
    {label}
    {count !== undefined && (
      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
        {count}
      </span>
    )}
  </Button>
)

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('tasks')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const { user, signOut } = useAuthStore()
  
  const {
    tasks,
    activeTaskId,
    isLoading,
    error,
    createTask,
    deleteTask,
    startTask,
    pauseTask,
    completeTask,
    cancelTask,
    exportTasks,
    importTasks,
    getTask,
  } = useSupabaseTasks()

  /**
   * Maneja el cierre de sesión
   */
  const handleSignOut = async () => {
    await signOut()
  }

  const activeTask = activeTaskId ? getTask(activeTaskId) : null

  const handleCreateTask = (data: CreateTaskData) => {
    createTask(data)
    setShowTaskForm(false)
  }

  const handleEditTask = (taskId: string) => {
    // Por ahora, solo mostramos el formulario
    // En una implementación completa, cargaríamos los datos de la tarea
    console.log('Editar tarea:', taskId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ListTodo className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">VeraTasks</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {user && (
                  <span className="text-sm text-gray-600">
                    {user.email}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </div>
              
              {activeTask && (
                <div className="flex items-center gap-4 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Activa: {activeTask.title}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseTask(activeTask.id)}
                  >
                    <PauseCircle className="w-4 h-4" />
                    Pausar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-80px)]">
            <nav className="p-4 space-y-2">
              <NavigationButton
                view="tasks"
                icon={ListTodo}
                label="Tareas"
                count={tasks.length}
                currentView={currentView}
                onViewChange={setCurrentView}
              />
              <NavigationButton
                view="stats"
                icon={BarChart3}
                label="Estadísticas"
                currentView={currentView}
                onViewChange={setCurrentView}
              />
              <NavigationButton
                view="import-export"
                icon={FileText}
                label="Importar/Exportar"
                currentView={currentView}
                onViewChange={setCurrentView}
              />
              
              <hr className="my-4" />
              
              <Button
                variant="outline"
                onClick={() => setShowTaskForm(true)}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </Button>

              {/* Resumen rápido */}
              <div className="pt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Resumen</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Completadas:</span>
                    <span>{tasks.filter(t => t.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En progreso:</span>
                    <span>{tasks.filter(t => t.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nuevas:</span>
                    <span>{tasks.filter(t => t.status === 'new').length}</span>
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6">
            {/* Estado de carga y errores */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando tareas...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">
                  Error al cargar las tareas: {error.message}
                </p>
              </div>
            )}

            {/* Formulario de nueva tarea (modal simple) */}
            {showTaskForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-md w-full mx-4">
                  <TaskForm
                    onSubmit={handleCreateTask}
                    onCancel={() => setShowTaskForm(false)}
                  />
                </div>
              </div>
            )}

            {/* Contenido principal según la vista */}
            {!isLoading && !error && (
              <>
                {currentView === 'tasks' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Gestión de Tareas</h2>
                      <Button onClick={() => setShowTaskForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Tarea
                      </Button>
                    </div>
                    
                    <TaskList
                      tasks={tasks}
                      activeTaskId={activeTaskId}
                      onStart={startTask}
                      onPause={pauseTask}
                      onComplete={completeTask}
                      onCancel={cancelTask}
                      onEdit={handleEditTask}
                      onDelete={deleteTask}
                    />
                  </div>
                )}

                {currentView === 'stats' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold">Análisis de Rendimiento</h2>
                      <p className="text-gray-600">
                        Revisa tus estadísticas y patrones de productividad
                      </p>
                    </div>
                    
                    <TaskStats tasks={tasks} />
                  </div>
                )}

                {currentView === 'import-export' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold">Gestión de Datos</h2>
                      <p className="text-gray-600">
                        Exporta o importa tus tareas para crear respaldos
                      </p>
                    </div>
                    
                    <ImportExport
                      onExport={exportTasks}
                      onImport={importTasks}
                      tasksCount={tasks.length}
                    />
                  </div>
                )}


              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export function App() {
  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  )
}

export default App