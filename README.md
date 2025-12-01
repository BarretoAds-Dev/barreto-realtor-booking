# 📅 Sistema de Reserva de Citas - Coldwell Banker

Sistema moderno de reserva de citas desarrollado con **Astro**, **Preact** y **Supabase**, diseñado específicamente para Coldwell Banker con validación avanzada y optimizaciones de rendimiento.

## 🚀 Características Principales

- ✅ **Arquitectura Islands** - JavaScript mínimo con Preact solo donde se necesita
- ✅ **Validación Avanzada** - Schemas Zod con validación en tiempo real
- ✅ **Base de Datos Supabase** - Gestión de disponibilidad y citas en tiempo real
- ✅ **Diseño Profesional** - Glassmorphism con branding Coldwell Banker
- ✅ **Type Safety Completo** - TypeScript en todo el proyecto
- ✅ **Arquitectura Modular** - Estructura organizada por features
- ✅ **CRM Integrado** - Panel de administración para gestionar citas

## 🛠️ Stack Tecnológico

- **Astro 5.16.3** - Framework principal (SSR)
- **Preact 10.27.2** - UI interactiva (Islands)
- **TypeScript** - Tipado estático
- **Tailwind CSS 3.4.18** - Estilos
- **Zod 4.1.13** - Validación de schemas
- **Supabase** - Base de datos y autenticación
- **Cloudflare Workers** - Deploy y hosting

## 📋 Requisitos Previos

- Node.js 18+ 
- pnpm (recomendado) o npm
- Cuenta de Supabase configurada

## 🏃 Instalación y Uso

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
# Crear archivo .env con:
# PUBLIC_SUPABASE_URL=tu_url_de_supabase
# PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima

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
├── features/                    # Features organizados por dominio
│   ├── appointments/           # Feature de citas
│   │   ├── components/         # Componentes específicos de citas
│   │   ├── api/               # API routes de citas (legacy, migrar a pages/api)
│   │   ├── hooks/             # Hooks específicos de citas
│   │   ├── types.ts           # Tipos específicos de citas
│   │   └── schemas.ts         # Schemas de validación Zod
│   ├── crm/                   # Feature de CRM
│   │   ├── components/        # Componentes del dashboard CRM
│   │   └── types.ts           # Tipos específicos del CRM
│   └── auth/                  # Feature de autenticación
│       ├── components/        # Componentes de login/logout
│       └── types.ts           # Tipos de autenticación
├── shared/                     # Código compartido
│   ├── components/            # Componentes compartidos
│   ├── ui/                    # Componentes UI reutilizables
│   └── utils/                # Utilidades compartidas
├── core/                      # Núcleo del sistema
│   ├── config/                # Configuraciones
│   │   ├── supabase.ts       # Cliente de Supabase público
│   │   └── auth.ts           # Cliente de Supabase con auth
│   ├── types/                 # Tipos base y tipos de DB
│   │   └── database.ts        # Tipos de Supabase
│   └── constants/             # Constantes globales
├── lib/                       # Librerías y servicios
│   ├── services/              # Servicios de negocio
│   │   ├── appointments.service.ts
│   │   └── availability.service.ts
│   └── utils/                 # Utilidades de librería
├── hooks/                     # Hooks globales de Preact
├── layouts/                   # Layouts de Astro
│   ├── Layout.astro
│   └── crm/
│       └── CRMLayout.astro
├── pages/                     # Páginas y API routes
│   ├── api/                   # API endpoints
│   │   ├── appointments.ts    # Crear citas
│   │   ├── availability.ts    # Obtener disponibilidad
│   │   ├── auth/              # Autenticación
│   │   └── crm/               # API del CRM
│   ├── citas/                 # Páginas públicas de citas
│   ├── crm/                   # Páginas del CRM
│   ├── login.astro            # Página de login
│   └── index.astro            # Página principal
└── content/                   # Content Collections (opcional)
    ├── config.ts
    ├── schedule/
    └── holidays/
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

## 🔧 Configuración

### Variables de Entorno

Crear `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

### Base de Datos

El proyecto requiere las siguientes tablas en Supabase:
- `agents` - Agentes inmobiliarios
- `availability_slots` - Slots de disponibilidad
- `appointments` - Citas reservadas
- `holidays` - Días festivos

Ver migraciones en `supabase/migrations/` para el esquema completo.

## 🚢 Despliegue

El proyecto está configurado para Cloudflare Workers:

```bash
# Build
pnpm build

# Los archivos estarán en dist/
```

### Plataformas Recomendadas

- **Cloudflare Pages** - Deploy automático desde GitHub
- **Vercel** - Deploy con funciones serverless
- **Netlify** - Deploy con funciones serverless

## 📝 Scripts Disponibles

```bash
pnpm dev      # Servidor de desarrollo (puerto 4321)
pnpm build    # Build de producción
pnpm preview  # Preview del build local
pnpm astro    # CLI de Astro
```

## 🏗️ Arquitectura

### Features-Based Organization

El proyecto está organizado por features (dominios de negocio):
- Cada feature tiene sus propios componentes, tipos y lógica
- Los servicios de negocio están en `lib/services/`
- La configuración central está en `core/`
- El código compartido está en `shared/`

### Separación de Responsabilidades

- **Components**: Solo UI y lógica de presentación
- **Services**: Lógica de negocio y comunicación con APIs
- **Types**: Definiciones de tipos TypeScript
- **Schemas**: Validación con Zod
- **API Routes**: Endpoints HTTP de Astro

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
- Supabase por la infraestructura de backend

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
