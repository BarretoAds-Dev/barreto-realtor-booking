# 📅 Sistema de Reserva de Citas - Coldwell Banker

Sistema moderno de reserva de citas desarrollado con **Astro**, **Preact** y **Content Collections**, diseñado específicamente para Coldwell Banker con validación avanzada y optimizaciones de rendimiento.

## 🚀 Características Principales

- ✅ **Arquitectura Islands** - JavaScript mínimo con Preact solo donde se necesita
- ✅ **Validación Avanzada** - Schemas Zod con validación en tiempo real
- ✅ **Content Collections** - Gestión estructurada de disponibilidad y horarios
- ✅ **Diseño Profesional** - Glassmorphism con branding Coldwell Banker
- ✅ **Type Safety Completo** - TypeScript en todo el proyecto
- ✅ **Optimizaciones** - Critical CSS inlining, lazy loading, SSG

## 🛠️ Stack Tecnológico

- **Astro 5.16.3** - Framework principal (SSG)
- **Preact 10.27.2** - UI interactiva (Islands)
- **TypeScript** - Tipado estático
- **Tailwind CSS 3.4.18** - Estilos
- **Zod 4.1.13** - Validación de schemas
- **Astro Content Collections** - Gestión de datos

## 📋 Requisitos Previos

- Node.js 18+ 
- pnpm (recomendado) o npm

## 🏃 Instalación y Uso

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Preview del build
pnpm preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Welcome.astro              # Contenedor principal
│   ├── AppointmentBooking.tsx    # Orquestador (Preact Island)
│   ├── Calendar.tsx               # Calendario interactivo
│   ├── TimeSlots.tsx              # Selección de horarios
│   ├── AppointmentForm.tsx       # Formulario con validación
│   ├── ConfirmationPanel.tsx     # Panel de confirmación
│   └── ProgressIndicator.tsx     # Indicador de progreso
├── content/
│   ├── config.ts                  # Configuración Content Collections
│   ├── availability/              # Horarios disponibles
│   ├── schedule/                  # Configuración de horarios
│   ├── holidays/                  # Días festivos
│   └── appointments/              # Citas reservadas
├── layouts/
│   └── Layout.astro               # Layout base
├── pages/
│   └── index.astro                # Página principal
└── schemas/
    └── appointmentSchema.ts       # Schemas de validación
```

## 🎯 Flujo de Reserva

1. **Selección de Fecha** - Calendario interactivo con fechas disponibles
2. **Selección de Hora** - Slots disponibles con capacidad
3. **Información del Cliente** - Formulario con validación en tiempo real
4. **Confirmación** - Panel de confirmación con detalles

## 💼 Tipos de Operación

### Rentar
- Presupuesto: $20,000 - $150,000+ MXN
- Empresa donde labora

### Comprar
- Presupuesto: $2,500,000 - $10,000,000+ MXN
- Tipo de recurso:
  - Recursos propios
  - Crédito bancario (banco + crédito preaprobado)
  - Infonavit (modalidad + número de trabajador)
  - Fovissste (modalidad + número de trabajador)

## 🎨 Diseño

- **Colores Coldwell Banker**: `#003d82`, `#00a0df`, `#004C97`
- **Glassmorphism**: Efectos de blur y transparencia
- **Tema Oscuro**: Optimizado para reducir fatiga visual
- **Responsive**: Diseño adaptable a todos los dispositivos

## ✅ Validación

- Validación en tiempo real con mensajes personalizados
- Regex para formatos (email, teléfono, fechas)
- Validación condicional según tipo de operación
- Schemas Zod con type safety completo

## 📊 Métricas de Rendimiento

- **Bundle Size (gzipped)**: ~30 kB de JavaScript
- **LCP Optimizado**: Critical CSS inlined
- **SSG**: Pre-renderizado estático para máximo rendimiento

## 🔧 Configuración

### Content Collections

Los datos se gestionan a través de Content Collections en `src/content/`:

- `availability/` - Horarios disponibles por fecha
- `schedule/` - Configuración de horarios de negocio
- `holidays/` - Días festivos bloqueados
- `appointments/` - Citas reservadas

### Variables de Entorno

Crear `.env` para configuración local (opcional):

```env
# Ejemplo de variables de entorno
PUBLIC_API_URL=https://api.ejemplo.com
```

## 🚢 Despliegue

El proyecto está optimizado para despliegue estático:

```bash
# Build
pnpm build

# Los archivos estáticos estarán en dist/
```

### Plataformas Recomendadas

- **Vercel** - Deploy automático desde GitHub
- **Netlify** - Deploy con funciones serverless
- **Cloudflare Pages** - Deploy rápido y global
- **GitHub Pages** - Hosting estático gratuito

## 📝 Scripts Disponibles

```bash
pnpm dev      # Servidor de desarrollo (puerto 4321)
pnpm build    # Build de producción
pnpm preview  # Preview del build local
pnpm astro    # CLI de Astro
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es propiedad de Coldwell Banker.

## 👥 Autor

**BarretoAds-Dev**
- GitHub: [@BarretoAds-Dev](https://github.com/BarretoAds-Dev)

## 🙏 Agradecimientos

- Astro Team por el excelente framework
- Preact por la ligereza y performance
- Tailwind CSS por la utilidad de estilos
- Zod por la validación robusta

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
