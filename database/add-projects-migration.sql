-- Migración para agregar soporte de proyectos a VeraTasks
-- Ejecutar después de migrations.sql

-- Tabla para los proyectos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6' CHECK (color ~ '^#[0-9a-fA-F]{6}$'), -- color hexadecimal
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar columna project_id a la tabla tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Crear proyecto por defecto para tareas existentes (opcional)
INSERT INTO public.projects (name, description, color, user_id)
VALUES ('General', 'Proyecto por defecto para tareas sin categorizar', '#6b7280', 'anonymous-user')
ON CONFLICT DO NOTHING;

-- Obtener el ID del proyecto por defecto y actualizar tareas existentes sin proyecto
UPDATE public.tasks 
SET project_id = (SELECT id FROM public.projects WHERE name = 'General' AND user_id = 'anonymous-user' LIMIT 1)
WHERE project_id IS NULL;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- Trigger para actualizar updated_at en projects
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON public.projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS para projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Política RLS para permitir acceso completo por ahora
CREATE POLICY "Allow all operations on projects" ON public.projects
  FOR ALL USING (true);

-- Comentarios para documentar la nueva tabla
COMMENT ON TABLE public.projects IS 'Proyectos para organizar las tareas';
COMMENT ON COLUMN public.projects.user_id IS 'ID del usuario propietario del proyecto';
COMMENT ON COLUMN public.projects.color IS 'Color hexadecimal para identificación visual del proyecto';
COMMENT ON COLUMN public.projects.is_archived IS 'Indica si el proyecto está archivado';
COMMENT ON COLUMN public.tasks.project_id IS 'ID del proyecto al que pertenece la tarea (opcional)';