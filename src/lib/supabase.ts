/**
 * Configuración de Supabase
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para las tablas de Supabase
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow
        Insert: TaskInsert
        Update: TaskUpdate
      }
      task_history: {
        Row: TaskHistoryRow
        Insert: TaskHistoryInsert
        Update: TaskHistoryUpdate
      }
      projects: {
        Row: ProjectRow
        Insert: ProjectInsert
        Update: ProjectUpdate
      }
    }
  }
}

export interface TaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'new' | 'active' | 'completed' | 'cancelled'
  estimated_time: number | null
  actual_time: number | null
  project_id: string | null
  is_archived: boolean
  created_at: string
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  updated_at: string
}

export interface TaskInsert {
  id?: string
  user_id: string
  title: string
  description?: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'new' | 'active' | 'completed' | 'cancelled'
  estimated_time?: number | null
  actual_time?: number | null
  project_id?: string | null
  is_archived?: boolean
  created_at?: string
  started_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
}

export interface TaskUpdate {
  title?: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  status?: 'new' | 'active' | 'completed' | 'cancelled'
  estimated_time?: number | null
  actual_time?: number | null
  project_id?: string | null
  is_archived?: boolean
  started_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  updated_at?: string
}

export interface TaskHistoryRow {
  id: string
  task_id: string
  status: 'new' | 'active' | 'completed' | 'cancelled'
  changed_at: string
  time_in_status: number | null
}

export interface TaskHistoryInsert {
  id?: string
  task_id: string
  status: 'new' | 'active' | 'completed' | 'cancelled'
  changed_at?: string
  time_in_status?: number | null
}

export interface TaskHistoryUpdate {
  time_in_status?: number | null
}

export interface ProjectRow {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  is_archived: boolean
  azure_devops_board_url: string | null
  created_at: string
  updated_at: string
}

export interface ProjectInsert {
  id?: string
  user_id: string
  name: string
  description?: string | null
  color?: string
  is_archived?: boolean
  azure_devops_board_url?: string | null
  created_at?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
  color?: string
  is_archived?: boolean
  azure_devops_board_url?: string | null
  updated_at?: string
}