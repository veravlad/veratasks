# VeraTasks - Gestor de Tareas Personal

Una aplicación web moderna para gestionar tareas personales con seguimiento de tiempo, análisis de rendimiento y almacenamiento local.

## 🚀 Características

### ✅ Gestión de Tareas
- **Crear, editar y eliminar tareas** con título, descripción y prioridad
- **Estados de tarea**: Nueva, En Progreso, Completada, Cancelada
- **Prioridades**: Alta, Media, Baja
- **Solo una tarea activa** a la vez para mantener el foco
- **Estimación de tiempo** y seguimiento de tiempo real

### ⏱️ Seguimiento de Tiempo
- **Tiempo estimado vs tiempo real** para cada tarea
- **Historial completo** de cambios de estado con timestamps
- **Tiempo promedio** en cada estado (Nueva, En Progreso)
- **Cálculo automático** del tiempo total de trabajo

### 📊 Análisis de Rendimiento
- **Dashboard de estadísticas** completo
- **Métricas de productividad**:
  - Total de tareas y completadas
  - Tiempo total activo
  - Tasa de completación
  - Tiempo promedio de completación
- **Distribución visual** por estado y prioridad
- **Análisis de tiempo** por estado

### 💾 Almacenamiento Local
- **100% local** - Los datos solo se almacenan en tu navegador
- **Sin servidores externos** - Privacidad total
- **Persistencia automática** en localStorage
- **No se requiere conexión a internet**

### 🔄 Importar/Exportar
- **Exportar todas las tareas** en formato JSON
- **Importar tareas** desde archivos JSON
- **Dos modos de importación**:
  - Combinar con tareas existentes
  - Reemplazar todas las tareas
- **Respaldos fáciles** para no perder datos

### 🔍 Filtros y Búsqueda
- **Búsqueda por texto** en título y descripción
- **Filtros por estado** y prioridad
- **Ordenación flexible** (fecha, título, prioridad, estado)
- **Vista en tiempo real** de la tarea activa

## 🛠️ Tecnologías

- **Frontend**: React 19 + TypeScript
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Formularios**: React Hook Form + Zod
- **Fechas**: date-fns (español)
- **Estado**: React Query + Custom Hooks
- **Iconos**: Lucide React
- **Build**: Vite

## 🚦 Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- pnpm (recomendado)

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd veratasks

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm run dev

# Abrir http://localhost:5173 en tu navegador
```

### Comandos Disponibles
```bash
pnpm run dev      # Servidor de desarrollo
pnpm run build    # Build para producción
pnpm run preview  # Vista previa del build
pnpm run lint     # Linter de código
```

## 📱 Cómo Usar

### 1. Crear Tareas
1. Haz clic en "Nueva Tarea" 
2. Completa título (requerido), descripción, prioridad y tiempo estimado
3. Guarda la tarea

### 2. Gestionar Flujo de Trabajo
- **▶️ Iniciar**: Cambia el estado a "En Progreso" y comienza el seguimiento
- **⏸️ Pausar**: Pausa el trabajo y regresa a estado "Nueva"
- **✅ Completar**: Marca como completada y calcula el tiempo real
- **❌ Cancelar**: Cancela la tarea

### 3. Ver Estadísticas
- Ve a la sección "Estadísticas"
- Revisa métricas de rendimiento
- Analiza patrones de productividad

### 4. Respaldos
- Ve a "Importar/Exportar"
- Exporta todas tus tareas en formato JSON
- Importa respaldos cuando necesites

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base de shadcn/ui
│   ├── TaskForm.tsx    # Formulario de tareas
│   ├── TaskItem.tsx    # Componente de tarea individual
│   ├── TaskList.tsx    # Lista con filtros
│   ├── TaskStats.tsx   # Dashboard de estadísticas
│   └── ImportExport.tsx # Gestión de datos
├── hooks/              # Custom hooks
│   ├── useLocalStorage.ts # Gestión de localStorage
│   └── useTasks.ts     # Lógica de tareas
├── types/              # Definiciones TypeScript
│   └── task.ts         # Tipos de tareas
├── schemas/            # Validación con Zod
│   └── task.ts         # Esquemas de formularios
├── utils/              # Utilidades
│   └── task.ts         # Funciones auxiliares
└── App.tsx            # Componente principal
```

## 📊 Métricas Incluidas

### Rendimiento Personal
- **Tiempo promedio de completación** por tarea
- **Tasa de completación** (% de tareas terminadas)
- **Tiempo total activo** trabajado
- **Distribución de tiempo** por estado

### Análisis de Patrones
- **Tiempo promedio en estado "Nueva"** (procrastinación)
- **Tiempo promedio en estado "En Progreso"** (foco)
- **Distribución por prioridad** (gestión de importancia)
- **Historial completo** de cambios de estado

## 🔒 Privacidad y Datos

- **Completamente local**: Los datos solo existen en tu navegador
- **Sin tracking**: No se envía información a servidores externos  
- **Control total**: Puedes exportar y eliminar todos los datos
- **Sin cookies**: Solo usa localStorage del navegador

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**VeraTasks** - Tu compañero personal para la gestión eficiente de tareas y análisis de productividad. ⚡
