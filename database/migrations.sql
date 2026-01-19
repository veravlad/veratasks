-- Crear tablas para VeraTasks en Supabase

-- Tabla para las tareas
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('new', 'active', 'completed', 'cancelled')),
  estimated_time INTEGER, -- en minutos
  actual_time INTEGER, -- en minutos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para el historial de estados
CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('new', 'active', 'completed', 'cancelled')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_in_status INTEGER -- tiempo en este estado en minutos
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON public.task_history(changed_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en tasks
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir acceso completo por ahora
-- En una app real, esto estaría basado en auth.uid()
CREATE POLICY "Allow all operations on tasks" ON public.tasks
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on task_history" ON public.task_history
  FOR ALL USING (true);

-- Comentarios para documentar las tablas
COMMENT ON TABLE public.tasks IS 'Tabla principal de tareas de VeraTasks';
COMMENT ON TABLE public.task_history IS 'Historial de cambios de estado de las tareas';

COMMENT ON COLUMN public.tasks.user_id IS 'ID del usuario (por ahora anonymous-user)';
COMMENT ON COLUMN public.tasks.estimated_time IS 'Tiempo estimado en minutos';
COMMENT ON COLUMN public.tasks.actual_time IS 'Tiempo real transcurrido en minutos';
COMMENT ON COLUMN public.task_history.time_in_status IS 'Tiempo que estuvo en este estado (minutos)';