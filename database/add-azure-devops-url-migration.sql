-- Migración para agregar URL de Azure DevOps a proyectos
-- Ejecutar después de add-projects-migration.sql

-- Agregar columna azure_devops_board_url a la tabla projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS azure_devops_board_url TEXT;

-- Validación de URL (opcional, para asegurar formato correcto)
ALTER TABLE public.projects 
ADD CONSTRAINT check_azure_devops_url_format 
CHECK (azure_devops_board_url IS NULL OR azure_devops_board_url ~ '^https?://');

-- Crear índice para búsquedas por URL (opcional, si se necesita)
CREATE INDEX IF NOT EXISTS idx_projects_azure_devops_url ON public.projects(azure_devops_board_url) 
WHERE azure_devops_board_url IS NOT NULL;

-- Comentarios para documentar el nuevo campo
COMMENT ON COLUMN public.projects.azure_devops_board_url IS 'URL opcional del board de Azure DevOps relacionado con el proyecto';