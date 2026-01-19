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