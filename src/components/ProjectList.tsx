/**
 * Componente para gestionar proyectos
 */
import { useState } from 'react'
import { Plus, Edit, Archive, Trash2, Folder, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { useSupabaseProjects } from '../hooks/useSupabaseProjects'
import type { Project } from '../types/task'
import type { CreateProjectData, UpdateProjectData } from '../schemas/task'

interface ProjectListProps {
  onSelectProject?: (projectId: string) => void
  selectedProjectId?: string
}

export function ProjectList({ onSelectProject, selectedProjectId }: ProjectListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const {
    projects,
    archivedProjects,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    getProject,
  } = useSupabaseProjects()

  const displayProjects = showArchived ? archivedProjects : projects
  const editingProject = editingProjectId ? getProject(editingProjectId) : null

  const handleCreateProject = async (data: CreateProjectData) => {
    await createProject(data)
    setShowForm(false)
  }

  const handleUpdateProject = async (data: UpdateProjectData) => {
    if (!editingProjectId) return
    await updateProject(editingProjectId, data)
    setEditingProjectId(null)
    setShowForm(false)
  }

  const handleSubmit = (data: CreateProjectData | UpdateProjectData) => {
    if (editingProjectId) {
      handleUpdateProject(data as UpdateProjectData)
    } else {
      handleCreateProject(data as CreateProjectData)
    }
  }

  const handleEdit = (projectId: string) => {
    setEditingProjectId(projectId)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingProjectId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar proyectos: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Proyectos</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? 'ghost' : 'default'}
              size="sm"
              onClick={() => setShowArchived(false)}
            >
              Activos ({projects.length})
            </Button>
            <Button
              variant={showArchived ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowArchived(true)}
            >
              Archivados ({archivedProjects.length})
            </Button>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={isCreating || isUpdating || isDeleting}
          className="disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Formulario (modal simple) */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <ProjectForm
              onSubmit={handleSubmit}
              onCancel={handleCancelForm}
              editingProject={editingProject || undefined}
            />
          </div>
        </div>
      )}

      {/* Lista de proyectos */}
      {displayProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">
            {showArchived ? 'No hay proyectos archivados' : 'No hay proyectos aún'}
          </p>
          <p>
            {showArchived
              ? 'Los proyectos archivados aparecerán aquí'
              : '¡Crea tu primer proyecto para organizar tus tareas!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={project.id === selectedProjectId}
              onSelect={() => onSelectProject?.(project.id)}
              onEdit={() => handleEdit(project.id)}
              onArchive={() => archiveProject(project.id)}
              onUnarchive={() => unarchiveProject(project.id)}
              onDelete={() => deleteProject(project.id)}
              isArchived={showArchived}
              disabled={isUpdating || isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onArchive?: () => void
  onUnarchive?: () => void
  onDelete?: () => void
  isArchived?: boolean
  disabled?: boolean
}

function ProjectCard({
  project,
  isSelected,
  onSelect,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  isArchived,
  disabled,
}: ProjectCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${disabled ? 'opacity-75' : ''}`}
      onClick={onSelect}
    >
      <div className="space-y-3">
        {/* Header con color y nombre */}
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="font-medium truncate flex-1">{project.name}</h3>
          {isArchived && (
            <Badge variant="secondary" className="text-xs">
              Archivado
            </Badge>
          )}
        </div>

        {/* Descripción */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Azure DevOps Board Link */}
        {project.azureDevOpsBoardUrl && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
            <ExternalLink className="w-3 h-3 text-blue-600" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(project.azureDevOpsBoardUrl, '_blank')
              }}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Abrir Azure DevOps Board
            </button>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
              disabled={disabled}
              className="disabled:opacity-50"
            >
              <Edit className="w-3 h-3" />
            </Button>
            
            {isArchived ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onUnarchive?.()
                }}
                disabled={disabled}
                className="disabled:opacity-50 text-green-600 hover:text-green-700"
              >
                <Archive className="w-3 h-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive?.()
                }}
                disabled={disabled}
                className="disabled:opacity-50 text-orange-600 hover:text-orange-700"
              >
                <Archive className="w-3 h-3" />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
                  onDelete?.()
                }
              }}
              disabled={disabled}
              className="disabled:opacity-50 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  )
}

interface ProjectFormProps {
  onSubmit: (data: CreateProjectData | UpdateProjectData) => void
  onCancel: () => void
  editingProject?: Project
}

function ProjectForm({ onSubmit, onCancel, editingProject }: ProjectFormProps) {
  const [name, setName] = useState(editingProject?.name || '')
  const [description, setDescription] = useState(editingProject?.description || '')
  const [color, setColor] = useState(editingProject?.color || '#3b82f6')
  const [azureDevOpsBoardUrl, setAzureDevOpsBoardUrl] = useState(editingProject?.azureDevOpsBoardUrl || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      azureDevOpsBoardUrl: azureDevOpsBoardUrl.trim() || undefined,
    })
  }

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del proyecto"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción opcional"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL de Azure DevOps Board</label>
          <input
            type="url"
            value={azureDevOpsBoardUrl}
            onChange={(e) => setAzureDevOpsBoardUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://dev.azure.com/organization/project/_boards/board/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Opcional: Enlace al board de Azure DevOps relacionado con este proyecto
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="grid grid-cols-8 gap-2 mb-2">
            {predefinedColors.map(predefinedColor => (
              <button
                key={predefinedColor}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  color === predefinedColor ? 'border-gray-600' : 'border-gray-300'
                }`}
                style={{ backgroundColor: predefinedColor }}
                onClick={() => setColor(predefinedColor)}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {editingProject ? 'Actualizar' : 'Crear'} Proyecto
          </Button>
        </div>
      </form>
    </div>
  )
}