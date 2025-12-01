# Guía de Migración - Nueva Estructura del Proyecto

Este documento describe los cambios realizados en la reorganización del proyecto.

## 📋 Cambios Principales

### Nueva Estructura de Directorios

El proyecto ahora sigue una arquitectura **features-based** con separación clara de responsabilidades:

```
src/
├── features/          # Features organizados por dominio
├── shared/           # Código compartido
├── core/             # Núcleo del sistema (config, types)
├── lib/              # Servicios y utilidades
└── pages/            # Páginas y API routes
```

### Cambios en Imports

#### Antes:
```typescript
import { supabase } from '../../config/supabase/supabase';
import { validateAppointment } from '../../config/schemas/appointmentSchema';
import AppointmentBooking from './citas/AppointmentBooking';
```

#### Después:
```typescript
import { supabase } from '../../core/config/supabase';
import { validateAppointment } from '../../features/appointments/schemas';
import AppointmentBooking from '../../features/appointments/components/AppointmentBooking';
```

### Rutas de API Actualizadas

- `/api/citas/appointments` → `/api/appointments`
- `/api/citas/availability` → `/api/availability`
- `/api/auth/*` → Sin cambios (ya estaba bien organizado)
- `/api/crm/*` → Sin cambios (ya estaba bien organizado)

### Servicios Creados

Se crearon servicios para separar la lógica de negocio:

- `lib/services/appointments.service.ts` - Gestión de citas
- `lib/services/availability.service.ts` - Gestión de disponibilidad

### Tipos Centralizados

- `core/types/database.ts` - Todos los tipos de Supabase
- `features/appointments/types.ts` - Tipos específicos de citas

## 🔄 Archivos Migrados

### Componentes
- ✅ `components/citas/*` → `features/appointments/components/*`
- ✅ `components/CRM/*` → `features/crm/components/*`
- ✅ `components/auth/*` → `features/auth/components/*`

### Configuración
- ✅ `config/supabase/supabase.ts` → `core/config/supabase.ts`
- ✅ `config/supabase/auth.ts` → `core/config/auth.ts`
- ✅ `config/schemas/appointmentSchema.ts` → `features/appointments/schemas.ts`
- ✅ `config/utils/clientValidation.ts` → `shared/utils/validation.ts`

### API Routes
- ✅ `pages/api/citas/appointments.ts` → `pages/api/appointments.ts`
- ✅ `pages/api/citas/availability.ts` → `pages/api/availability.ts`

## 📝 Notas Importantes

1. **Archivos Antiguos**: Los archivos en `src/components/` y `src/config/` todavía existen pero ya no se usan. Pueden eliminarse después de verificar que todo funciona.

2. **Migraciones de Supabase**: Las migraciones SQL permanecen en `src/config/supabase/migrations/` y `supabase/migrations/`. Esto es correcto ya que son archivos de configuración de base de datos.

3. **Content Collections**: Los archivos en `src/content/` permanecen sin cambios ya que son parte del sistema de Content Collections de Astro.

## ✅ Checklist de Verificación

- [x] Nueva estructura de directorios creada
- [x] Tipos TypeScript reorganizados
- [x] Servicios de negocio creados
- [x] Componentes movidos a features
- [x] API routes actualizadas
- [x] Imports actualizados en todos los archivos
- [x] README actualizado
- [ ] Eliminar archivos antiguos (después de verificar)
- [ ] Probar todas las funcionalidades

## 🚀 Próximos Pasos

1. Probar la aplicación completa para asegurar que todo funciona
2. Eliminar archivos antiguos en `src/components/` y `src/config/` (excepto migraciones)
3. Considerar crear hooks personalizados en `src/hooks/`
4. Agregar constantes globales en `src/core/constants/`

