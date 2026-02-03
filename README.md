# TimeTrack ⏳

**TimeTrack** es una aplicación moderna para el control y gestión de jornadas laborales. Permite a los usuarios registrar sus horas de trabajo, gestionar pausas, visualizar estadísticas y consultar su historial de registros, todo con una interfaz limpia y responsive.

![TimeTrack Dashboard](./design_ux.png)

## 🚀 Características

- **Control de Tiempo Real**: Cronómetro preciso para jornadas y pausas.
- **Gestión de Pausas**: Tipos de pausas configurables (Café, Almuerzo, etc.) con seguimiento de tiempo.
- **Dashboard Interactivo**: Visualización de métricas clave (Horas trabajadas, tendencias semamanles).
- **Historial Completo**: Consulta y filtrado de registros pasados.
- **Reportes**: Análisis mensual y exportación de datos (CSV).
- **Autenticación Segura**: Login y registro gestionados por Supabase.
- **Modo Oscuro/Claro**: Adaptado a tu preferencia (Interfaz basada en shadcn/ui).
- **Responsive**: Funciona perfectamente en escritorio y móvil.

## 🛠️ Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Estilos**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts
- **Gestión de Estado**: React Context + Hooks
- **Base de Datos & Auth**: Supabase (PostgreSQL + RLS)
- **Fechas**: date-fns

## ⚙️ Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- Una cuenta en [Supabase](https://supabase.com)

### 1. Clonar el repositorio
```bash
git clone https://github.com/usuario/timetrack.git
cd timetrack
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el ejemplo (o añade tus credenciales):

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

### 4. Configurar Base de Datos
Ejecuta el script SQL proporcionado en `db/schema.sql` (si existe) o configura las tablas:
- `profiles`
- `time_entries`
- `pauses`

*Nota: La aplicación incluye políticas RLS para asegurar que cada usuario solo vea sus propios datos.*

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

## 📱 Uso

1. **Regístrate** con un email y contraseña.
2. Accede al **Dashboard** para ver tus estadísticas.
3. Pulsa **"Empezar Jornada"** para iniciar el contador.
4. Usa los botones de **Pausa** para registrar descansos.
5. Al finalizar, pulsa **"Terminar Jornada"**.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un Pull Request para mejoras.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
