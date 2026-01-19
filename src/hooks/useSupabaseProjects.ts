/**
 * Hook para gestión de proyectos con Supabase
 */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type ProjectRow, type ProjectInsert } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Project } from '../types/task'
import type { CreateProjectData, UpdateProjectData } from '../schemas/task'

/**
 * Convierte ProjectRow de Supabase a Project del frontend
 */
function mapProjectRowToProject(projectRow: ProjectRow): Project {
  return {
    id: projectRow.id,
    name: projectRow.name,
    description: projectRow.description || undefined,
    color: projectRow.color,
    isArchived: projectRow.is_archived,
    createdAt: new Date(projectRow.created_at),
    updatedAt: new Date(projectRow.updated_at),
  }
}

/**
 * Convierte Project del frontend a ProjectInsert para Supabase
 */
function mapProjectToProjectInsert(project: Partial<Project>, userId: string): Partial<ProjectInsert> {
  return {
    id: project.id,
    user_id: userId,
    name: project.name!,
    description: project.description || null,
    color: project.color || '#3b82f6',
    is_archived: project.isArchived || false,
    created_at: project.createdAt?.toISOString(),
  }
}

export function useSupabaseProjects() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const userId = user?.id

  // Query para obtener todos los proyectos
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false) // Solo proyectos activos por defecto
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(mapProjectRowToProject)
    },
    enabled: !!userId,
  })

  // Query para obtener proyectos archivados
  const { data: archivedProjects = [] } = useQuery({
    queryKey: ['projects', userId, 'archived'],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', true)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return data.map(mapProjectRowToProject)
    },
    enabled: !!userId,
  })

  // Mutation para crear proyecto
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      if (!userId) throw new Error('User not authenticated')
      
      const now = new Date()
      const projectId = crypto.randomUUID()
      
      const newProject: Project = {
        id: projectId,
        name: data.name,
        description: data.description,
        color: data.color || '#3b82f6',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      }

      const projectInsert = mapProjectToProjectInsert(newProject, userId)
      const { error } = await supabase
        .from('projects')
        .insert([projectInsert as ProjectInsert])

      if (error) throw error

      return newProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
    },
  })

  // Mutation para actualizar proyecto
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: UpdateProjectData }) => {
      if (!userId) throw new Error('User not authenticated')
      
      const now = new Date()

      const { error } = await supabase
        .from('projects')
        .update({
          ...data,
          is_archived: data.isArchived,
          updated_at: now.toISOString(),
        })
        .eq('id', projectId)

      if (error) throw error

      return { projectId, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
      queryClient.invalidateQueries({ queryKey: ['projects', userId, 'archived'] })
    },
  })

  // Mutation para eliminar proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userId) throw new Error('User not authenticated')
      
      // Primero, actualizar todas las tareas para remover la referencia al proyecto
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ project_id: null })
        .eq('project_id', projectId)

      if (tasksError) throw tasksError

      // Luego eliminar el proyecto
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (projectError) throw projectError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] })
      queryClient.invalidateQueries({ queryKey: ['projects', userId, 'archived'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] }) // Invalidar tareas también
    },
  })

  // Funciones de conveniencia
  const createProject = useCallback((data: CreateProjectData) => {
    return createProjectMutation.mutateAsync(data)
  }, [createProjectMutation])

  const updateProject = useCallback((projectId: string, data: UpdateProjectData) => {
    return updateProjectMutation.mutateAsync({ projectId, data })
  }, [updateProjectMutation])

  const deleteProject = useCallback((projectId: string) => {
    deleteProjectMutation.mutate(projectId)
  }, [deleteProjectMutation])

  const archiveProject = useCallback((projectId: string) => {
    return updateProject(projectId, { isArchived: true })
  }, [updateProject])

  const unarchiveProject = useCallback((projectId: string) => {
    return updateProject(projectId, { isArchived: false })
  }, [updateProject])

  const getProject = useCallback((projectId: string): Project | undefined => {
    return [...projects, ...archivedProjects].find(project => project.id === projectId)
  }, [projects, archivedProjects])

  const getAllProjects = useCallback(() => {
    return [...projects, ...archivedProjects]
  }, [projects, archivedProjects])

  return {
    // Estado
    projects,
    archivedProjects,
    allProjects: getAllProjects(),
    isLoading,
    error,
    
    // Estados de carga de mutations
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    
    // Acciones
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    
    // Utilidades
    getProject,
    getAllProjects,
  }
}