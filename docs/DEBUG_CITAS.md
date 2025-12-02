# 🔍 Guía de Diagnóstico: Problemas al Crear Citas

Esta guía te ayudará a identificar y resolver problemas al crear citas en el sistema.

## 🛠️ Herramientas de Diagnóstico

### 1. Verificar Slots Disponibles
**Endpoint:** `GET /api/appointments/debug-slots`

**Uso:**
```bash
# Ver todos los slots de una fecha
curl "http://localhost:4321/api/appointments/debug-slots?date=2025-12-06"

# Ver slots de una fecha y hora específica
curl "http://localhost:4321/api/appointments/debug-slots?date=2025-12-06&time=10:00"

# Ver slots de un agent_id específico
curl "http://localhost:4321/api/appointments/debug-slots?date=2025-12-06&agentId=00000000-0000-0000-0000-000000000001"
```

**Respuesta incluye:**
- Todos los slots encontrados en la base de datos
- Slots que coinciden con la fecha/hora buscada
- Citas activas en cada slot
- Diagnósticos de formato (date, time, agent_id)

### 2. Verificar Citas en un Slot Específico
**Endpoint:** `GET /api/appointments/check-slot`

**Uso:**
```bash
# Reemplaza SLOT_ID con el ID del slot
curl "http://localhost:4321/api/appointments/check-slot?slotId=15e12383-fa3f-4e3a-bd50-8b5c737988c5"
```

**Respuesta incluye:**
- Detalles del slot (fecha, hora, capacidad)
- Lista de citas activas
- Lista de citas canceladas
- Disponibilidad restante

### 3. Limpiar Citas de Prueba
**Endpoint:** `POST /api/appointments/cleanup-test`

**Uso:**
```bash
# Limpiar todas las citas de prueba (últimas 24 horas)
curl -X POST "http://localhost:4321/api/appointments/cleanup-test" \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 1}'

# Limpiar citas de un slot específico
curl -X POST "http://localhost:4321/api/appointments/cleanup-test" \
  -H "Content-Type: application/json" \
  -d '{"slotId": "15e12383-fa3f-4e3a-bd50-8b5c737988c5", "daysOld": 1}'
```

## 📋 Checklist de Problemas Comunes

### ❌ Error 404: "Slot no encontrado o no disponible"

**Causas posibles:**
1. **agent_id no coincide**
   - El slot en la base tiene un `agent_id` diferente a `00000000-0000-0000-0000-000000000001`
   - **Solución:** Verifica en Supabase que el `agent_id` del slot sea correcto

2. **Formato de fecha incorrecto**
   - El formato debe ser `YYYY-MM-DD` (ej: `2025-12-06`)
   - **Solución:** Verifica que el frontend envíe la fecha en este formato

3. **Formato de hora no coincide**
   - El slot en DB tiene `10:00:00` pero envías `10:00`
   - **Solución:** El sistema normaliza automáticamente, pero verifica los logs

4. **Slot deshabilitado**
   - El campo `enabled` del slot es `false`
   - **Solución:** Verifica en Supabase que `enabled = true`

**Cómo diagnosticar:**
```bash
# 1. Ver qué slots existen para esa fecha
curl "http://localhost:4321/api/appointments/debug-slots?date=2025-12-06"

# 2. Revisar los logs del servidor cuando intentas crear la cita
# Busca el log "🔍 Buscando slot:" para ver qué está buscando
```

### ❌ Error 409: "Slot completo"

**Causas posibles:**
1. **El slot realmente está lleno**
   - Ya hay `capacity` citas activas en ese slot
   - **Solución:** Selecciona otro horario disponible

2. **Contador desactualizado**
   - El campo `booked` del slot no coincide con las citas reales
   - **Solución:** El sistema cuenta las citas reales, pero puedes limpiar citas de prueba

**Cómo diagnosticar:**
```bash
# 1. Ver qué citas están ocupando el slot
curl "http://localhost:4321/api/appointments/check-slot?slotId=TU_SLOT_ID"

# 2. Revisar los logs del servidor
# Busca "📋 Citas activas encontradas en el slot:" para ver detalles
```

### ❌ Error 400: "Validation failed"

**Causas posibles:**
1. **Campos faltantes**
   - Falta `name`, `email`, `operationType`, etc.
   - **Solución:** Verifica que el formulario envíe todos los campos requeridos

2. **Formato incorrecto**
   - Email inválido, hora en formato incorrecto, etc.
   - **Solución:** Revisa el schema de validación en `appointment.schema.ts`

**Cómo diagnosticar:**
- Revisa la respuesta del servidor, incluye `issues` con los campos que fallaron
- Revisa los logs: `❌ Validación fallida:`

### ❌ Error 500: "Error interno del servidor"

**Causas posibles:**
1. **RLS bloqueando la inserción**
   - Las políticas de Row Level Security están bloqueando
   - **Solución:** Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada

2. **Columna faltante**
   - La tabla `appointments` no tiene la columna `property_id`
   - **Solución:** El sistema intenta sin `property_id`, pero verifica la migración

3. **Error de conexión a Supabase**
   - Credenciales incorrectas o Supabase caído
   - **Solución:** Verifica las variables de entorno

**Cómo diagnosticar:**
- Revisa los logs del servidor para el error específico
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté en `.env`

## 🔧 Verificación en Supabase

### 1. Verificar Slots
```sql
SELECT
  id,
  date,
  start_time,
  enabled,
  agent_id,
  capacity,
  booked
FROM availability_slots
WHERE date = '2025-12-06'
  AND enabled = true
  AND agent_id = '00000000-0000-0000-0000-000000000001'
ORDER BY start_time;
```

### 2. Verificar Citas Activas
```sql
SELECT
  id,
  slot_id,
  status,
  email,
  name,
  created_at
FROM appointments
WHERE slot_id = 'TU_SLOT_ID'
  AND status IN ('pending', 'confirmed')
ORDER BY created_at DESC;
```

### 3. Verificar Estructura de Tabla
```sql
-- Verificar columnas de appointments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
```

## 📊 Logs del Servidor

Cuando intentas crear una cita, busca estos logs en orden:

1. **`✅ Datos validados:`** - Confirma que la validación pasó
2. **`🔍 Buscando slot:`** - Muestra qué está buscando (date, time, agent_id)
3. **`📋 Slots encontrados en DB:`** - Muestra todos los slots encontrados
4. **`✅ Slot encontrado:`** - Confirma que encontró el slot
5. **`📊 Verificación de disponibilidad:`** - Muestra el conteo de citas
6. **`📋 Citas activas encontradas en el slot:`** - Detalles de las citas (si hay)
7. **`✅ Cita creada exitosamente:`** - Confirma la creación

Si alguno de estos logs no aparece o muestra un error, ese es el punto donde falla.

## 🚀 Solución Rápida

Si el problema persiste:

1. **Limpia citas de prueba:**
   ```bash
   curl -X POST "http://localhost:4321/api/appointments/cleanup-test" \
     -H "Content-Type: application/json" \
     -d '{"daysOld": 1}'
   ```

2. **Verifica que los slots existan:**
   ```bash
   curl "http://localhost:4321/api/appointments/debug-slots?date=2025-12-06"
   ```

3. **Revisa los logs del servidor** cuando intentas crear la cita

4. **Verifica en Supabase** que:
   - Los slots tengan `enabled = true`
   - Los slots tengan `agent_id = '00000000-0000-0000-0000-000000000001'`
   - El formato de `date` sea `YYYY-MM-DD`
   - El formato de `start_time` sea `HH:MM:SS` o `HH:MM`

## 📝 Notas Importantes

- **agent_id:** Por defecto, el sistema busca slots con `agent_id = '00000000-0000-0000-0000-000000000001'`
- **Formato de hora:** El sistema normaliza automáticamente `10:00` a `10:00:00`
- **RLS:** El sistema usa `SUPABASE_SERVICE_ROLE_KEY` para bypass RLS en operaciones del servidor
- **Contador:** El sistema cuenta citas reales (`pending` o `confirmed`), no confía solo en el campo `booked`

