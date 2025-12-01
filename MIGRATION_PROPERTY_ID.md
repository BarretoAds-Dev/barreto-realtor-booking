# Migración: Agregar property_id a appointments

Esta migración agrega el campo `property_id` a la tabla `appointments` para relacionar citas con propiedades.

## Instrucciones

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Agregar campo property_id a la tabla appointments para relacionar citas con propiedades
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_appointments_property_id ON appointments(property_id);

-- Comentario en la columna
COMMENT ON COLUMN appointments.property_id IS 'ID de la propiedad relacionada con esta cita';
```

## Verificación

Después de ejecutar la migración, verifica que el campo se haya agregado correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'property_id';
```

Deberías ver:
- `column_name`: property_id
- `data_type`: uuid
- `is_nullable`: YES

