-- Migración para agregar campo is_archived a las tareas
-- Ejecutar después de add-projects-migration.sql

-- Agregar columna is_archived a la tabla tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Actualizar todas las tareas existentes para que no estén archivadas
UPDATE public.tasks 
SET is_archived = false 
WHERE is_archived IS NULL;

-- Hacer que la columna sea NOT NULL después de actualizar los valores existentes
ALTER TABLE public.tasks 
ALTER COLUMN is_archived SET NOT NULL;

-- Crear índice para mejorar el rendimiento de las consultas por estado de archivado
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON public.tasks(is_archived);

-- Crear índice compuesto para filtrar por usuario, archivado y estado
CREATE INDEX IF NOT EXISTS idx_tasks_user_archived_status ON public.tasks(user_id, is_archived, status);

-- Comentarios para documentar el nuevo campo
COMMENT ON COLUMN public.tasks.is_archived IS 'Indica si la tarea está archivada (soft delete)';