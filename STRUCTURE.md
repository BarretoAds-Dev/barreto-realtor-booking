# 📁 Estructura del Proyecto

Este documento describe la organización y convenciones de la arquitectura del proyecto.

## 🎯 Principios de Organización

1. **Separación de Concerns** - Cada carpeta tiene una responsabilidad clara
2. **Menos es Más** - Solo archivos esenciales, sin redundancias
3. **Escalabilidad** - Fácil agregar nuevas features sin afectar existentes
4. **Mantenibilidad** - Código fácil de encontrar y modificar

---

## 📂 Estructura de Directorios

```
src/
├── core/                          # ⭐ NÚCLEO DEL SISTEMA
│   ├── config/                    # Configuraciones centralizadas
│   │   ├── auth.ts                # Cliente Supabase con autenticación
│   │   ├── supabase.ts            # Cliente Supabase público
│   │   ├── constants.ts          # Constantes globales
│   │   ├── validation-rules.ts   # Reglas de validación compartidas
│   │   └── index.ts               # Barrel export
│   │
│   ├── types/                     # Tipos compartidos globalmente
│   │   ├── appointment.ts        # Tipos de citas
│   │   ├── database.ts           # Tipos de base de datos (Supabase)
│   │   ├── forms.ts              # Tipos de formularios
│   │   ├── user.ts               # Tipos de usuario
│   │   └── index.ts               # Barrel export
│   │
│   └── utils/                     # Utilidades core (máximo 5 archivos)
│       ├── dates.ts               # Manipulación de fechas
│       ├── format.ts              # Formateo de datos
│       └── validation.ts         # Validación compartida
│
├── features/                      # ⭐ MÓDULOS POR FUNCIONALIDAD
│   ├── appointments/             # Feature de citas
│   │   ├── components/           # Componentes específicos de citas
│   │   │   ├── AppointmentBooking.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── ConfirmationPanel.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   ├── TimeSlots.tsx
│   │   │   └── Welcome.astro     # Componente wrapper específico
│   │   ├── schemas/              # Validación Zod
│   │   │   └── appointment.schema.ts
│   │   └── services/            # Lógica de negocio (Supabase)
│   │       ├── appointment.service.ts
│   │       └── availability.service.ts
│   │
│   ├── auth/                     # Feature de autenticación
│   │   └── components/
│   │       └── LoginForm.tsx
│   │
│   └── crm/                      # Feature de CRM
│       └── components/
│           ├── CRMDashboard.tsx
│           ├── AppointmentsTable.tsx
│           └── ...
│
├── shared/                        # ⭐ COMPONENTES REUTILIZABLES
│   ├── ui/                       # Sistema de diseño (Atomic Design)
│   │   ├── atoms/                # Componentes base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Radio.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── index.ts          # Barrel export
│   │   ├── molecules/           # Combinaciones simples
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── FormField.tsx
│   │   │   └── index.ts          # Barrel export
│   │   └── index.ts              # Barrel export global
│   │
│   ├── components/              # Componentes complejos reutilizables
│   │   └── AppointmentFormFields.tsx
│   │
│   └── hooks/                   # Custom hooks globales
│       └── useAppointmentForm.ts
│
├── pages/                         # ⭐ RUTAS DE ASTRO
│   ├── api/                      # API Routes (Serverless)
│   │   ├── appointments/
│   │   │   ├── available.ts     # GET disponibilidad
│   │   │   └── index.ts         # POST crear cita
│   │   ├── auth/
│   │   │   ├── check-session.ts
│   │   │   └── logout.ts
│   │   └── crm/
│   │       ├── appointments-list.ts
│   │       └── appointments/
│   │           ├── delete.ts
│   │           └── update-status.ts
│   ├── citas/                    # Páginas públicas de citas
│   │   └── CitasDashboard.astro
│   ├── crm/                     # Páginas del CRM (protegidas)
│   │   └── crmdashboard.astro
│   ├── login.astro              # Página de login
│   └── index.astro              # Página principal (redirect)
│
├── layouts/                      # Layouts de Astro
│   ├── Layout.astro             # Layout base público
│   └── crm/
│       └── CRMLayout.astro      # Layout del CRM
│
└── middleware/                   # ⭐ EDGE MIDDLEWARE
    └── index.ts                  # Sequence de middlewares
```

---

## 📋 Convenciones de Organización

### `/core` - Fundamentos

**Propósito:** Código fundamental que no cambia frecuentemente.

**Reglas:**
- ✅ Máximo 5 archivos en `/utils`
- ✅ Configuraciones centralizadas en `/config`
- ✅ Tipos compartidos globalmente en `/types`
- ❌ No debe contener lógica de negocio específica

**Ejemplos:**
```typescript
// ✅ Correcto
import { supabase } from '@/core/config/supabase';
import type { Appointment } from '@/core/types';

// ❌ Incorrecto
import { createAppointment } from '@/core/utils'; // Lógica de negocio va en features
```

---

### `/features` - Módulos por Funcionalidad

**Propósito:** Cada feature es autocontenida (vertical slicing).

**Estructura requerida:**
- ✅ `components/` - Componentes específicos del feature
- ✅ `schemas/` - Validación Zod (si aplica)
- ✅ `services/` - Lógica de negocio (si aplica)

**Estructura opcional:**
- `hooks/` - Hooks específicos del feature
- `types/` - Tipos específicos del feature
- `utils/` - Utilidades específicas del feature

**Reglas:**
- ✅ Cada feature debe ser independiente
- ✅ No debe importar de otros features directamente
- ✅ Puede importar de `/core` y `/shared`
- ❌ No debe tener dependencias circulares

**Ejemplos:**
```typescript
// ✅ Correcto - Feature autocontenido
src/features/appointments/
  ├── components/
  ├── schemas/
  └── services/

// ❌ Incorrecto - Dependencia entre features
src/features/appointments/components/
  └── AppointmentForm.tsx
    import { CRMComponent } from '../../crm/components'; // ❌
```

---

### `/shared` - Componentes Reutilizables

**Propósito:** Componentes verdaderamente genéricos.

#### `/shared/ui/` - Sistema de Diseño (Atomic Design)

**Criterio:** Componentes puros de UI, sin lógica de negocio.

- **`atoms/`** - Componentes base (Button, Input, Radio, Select, Textarea)
- **`molecules/`** - Combinaciones simples (FormField, ErrorMessage)
- **`organisms/`** - Componentes complejos (futuro: DataTable, Modal)

**Reglas:**
- ✅ Componentes puros (presentational)
- ✅ Sin dependencias de features
- ✅ Reutilizables en cualquier contexto
- ❌ No debe contener lógica de negocio específica

#### `/shared/components/` - Componentes Complejos Reutilizables

**Criterio:** Componentes con lógica de negocio pero reutilizables.

**Ejemplos:**
- `AppointmentFormFields.tsx` - Campos de formulario reutilizables
- `DataTable.tsx` - Tabla de datos genérica (futuro)
- `Modal.tsx` - Modal genérico (futuro)

**Reglas:**
- ✅ Pueden tener lógica de negocio
- ✅ Deben ser reutilizables en múltiples features
- ❌ No deben ser específicos de un feature

#### `/shared/hooks/` - Custom Hooks Globales

**Criterio:** Hooks reutilizables en múltiples features.

**Ejemplos:**
- `useAppointmentForm.ts` - Lógica de formulario compartida
- `useForm.ts` - Hook genérico de formulario (futuro)
- `useMediaQuery.ts` - Hook para responsive (futuro)

---

### `/pages` - Rutas de Astro

**Propósito:** Estructura de rutas de la aplicación.

**Convenciones:**
- ✅ Archivos `.astro` para páginas estáticas
- ✅ Carpeta `api/` para API routes (serverless)
- ✅ Rutas anidadas con carpetas

**Ejemplos:**
```
pages/
  ├── index.astro              → /
  ├── login.astro              → /login
  ├── citas/
  │   └── CitasDashboard.astro → /citas/CitasDashboard
  └── api/
      └── appointments/
          └── index.ts         → /api/appointments
```

---

### `/middleware` - Edge Middleware

**Propósito:** Middleware ejecutado en el edge (Cloudflare Workers).

**Funciones:**
- Autenticación
- CORS
- Rate limiting (futuro)
- Logging (futuro)

---

## 🔄 Flujo de Datos

### 1. Página Pública (Citas)

```
CitasDashboard.astro (SSR)
  ↓
Welcome.astro (Static)
  ↓
AppointmentBooking.tsx (Island - client:load)
  ↓
API: /api/appointments/available
  ↓
Supabase: availability_slots
```

### 2. Página Protegida (CRM)

```
crmdashboard.astro (SSR)
  ↓
Middleware: authMiddleware (verifica sesión)
  ↓
CRMDashboard.tsx (Island - client:load)
  ↓
API: /api/crm/appointments-list
  ↓
Supabase: appointments (con RLS)
```

---

## 📦 Imports y Barrel Exports

### Convenciones de Import

```typescript
// ✅ Correcto - Usar barrel exports
import { Button, Input } from '@/shared/ui';
import { supabase } from '@/core/config';
import type { Appointment } from '@/core/types';

// ✅ Correcto - Import específico cuando es necesario
import { AppointmentBooking } from '@/features/appointments/components/AppointmentBooking';

// ❌ Incorrecto - Imports relativos largos
import { Button } from '../../../shared/ui/atoms/Button';
```

### Barrel Exports

Cada carpeta con múltiples archivos debe tener un `index.ts`:

```typescript
// src/shared/ui/atoms/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Radio } from './Radio';
export { Select } from './Select';
export { Textarea } from './Textarea';

// src/shared/ui/index.ts
export * from './atoms';
export * from './molecules';
```

---

## 🎨 Convenciones de Código

### Nombres de Archivos

- **Componentes:** PascalCase (`AppointmentBooking.tsx`)
- **Utilidades:** camelCase (`validation.ts`)
- **Tipos:** camelCase (`appointment.ts`)
- **Schemas:** camelCase con `.schema.ts` (`appointment.schema.ts`)

### Estructura de Componentes

```typescript
// 1. Imports
import { useState } from 'preact/hooks';
import { Button } from '@/shared/ui';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Componente
export default function ComponentName({ prop1, prop2 }: Props) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => {};
  
  // 6. Render
  return <div>...</div>;
}
```

---

## ✅ Checklist para Nuevas Features

Al agregar una nueva feature:

- [ ] Crear carpeta en `/features/[feature-name]`
- [ ] Agregar `components/` con componentes específicos
- [ ] Agregar `schemas/` si necesita validación
- [ ] Agregar `services/` si necesita lógica de negocio
- [ ] Crear página en `/pages/[route]`
- [ ] Crear API routes en `/pages/api/[route]` si es necesario
- [ ] No crear dependencias circulares
- [ ] Usar tipos de `/core/types` cuando sea posible
- [ ] Usar componentes de `/shared/ui` cuando sea posible

---

## 🚫 Anti-Patrones

### ❌ No Hacer

1. **Dependencias circulares entre features**
   ```typescript
   // ❌ appointments importa de crm
   import { CRMComponent } from '../../crm/components';
   ```

2. **Lógica de negocio en `/core/utils`**
   ```typescript
   // ❌ Lógica específica en utils
   export function createAppointment() { /* ... */ }
   ```

3. **Componentes específicos en `/shared`**
   ```typescript
   // ❌ Componente específico de citas en shared
   export function AppointmentCalendar() { /* ... */ }
   ```

4. **Imports relativos largos**
   ```typescript
   // ❌ Demasiados niveles
   import { Button } from '../../../../shared/ui/atoms/Button';
   ```

### ✅ Hacer

1. **Usar barrel exports**
   ```typescript
   import { Button } from '@/shared/ui';
   ```

2. **Separar concerns claramente**
   ```typescript
   // ✅ Lógica de negocio en services
   import { AppointmentsService } from '../services/appointment.service';
   ```

3. **Componentes reutilizables en `/shared`**
   ```typescript
   // ✅ Componente genérico en shared
   import { Button } from '@/shared/ui';
   ```

---

## 📚 Recursos Adicionales

- [Astro Documentation](https://docs.astro.build)
- [Preact Documentation](https://preactjs.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Atomic Design](https://atomicdesign.bradfrost.com)

---

**Última actualización:** 2025-11-30

