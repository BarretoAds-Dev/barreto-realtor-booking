-- Forzar recreación del trigger para asegurar que funcione correctamente

-- 1. Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS trg_update_slot_booking ON appointments;
DROP FUNCTION IF EXISTS update_slot_booking();

-- 2. Recrear la función del trigger con SECURITY DEFINER y logging
-- SECURITY DEFINER permite que la función se ejecute con los permisos del creador (postgres)
-- Esto evita problemas con RLS cuando el trigger intenta actualizar availability_slots
CREATE OR REPLACE FUNCTION update_slot_booking()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Para INSERT: Incrementar contador si la cita está activa
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('pending', 'confirmed') AND NEW.slot_id IS NOT NULL THEN
      UPDATE availability_slots 
      SET booked = booked + 1 
      WHERE id = NEW.slot_id;
      
      -- Log para debugging (solo en desarrollo)
      RAISE NOTICE 'Trigger ejecutado: INSERT - Slot % actualizado, booked incrementado', NEW.slot_id;
    END IF;
    RETURN NEW;
  
  -- Para UPDATE: Ajustar contador si cambió el estado o el slot
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió el slot, ajustar ambos slots
    IF OLD.slot_id IS DISTINCT FROM NEW.slot_id THEN
      -- Liberar el slot anterior si estaba activo
      IF OLD.status IN ('pending', 'confirmed') AND OLD.slot_id IS NOT NULL THEN
        UPDATE availability_slots 
        SET booked = GREATEST(0, booked - 1)
        WHERE id = OLD.slot_id;
        RAISE NOTICE 'Trigger ejecutado: UPDATE - Slot anterior % liberado', OLD.slot_id;
      END IF;
      -- Reservar el nuevo slot si está activo
      IF NEW.status IN ('pending', 'confirmed') AND NEW.slot_id IS NOT NULL THEN
        UPDATE availability_slots 
        SET booked = booked + 1
        WHERE id = NEW.slot_id;
        RAISE NOTICE 'Trigger ejecutado: UPDATE - Slot nuevo % reservado', NEW.slot_id;
      END IF;
    -- Si solo cambió el estado
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Si pasó de activo a inactivo
      IF OLD.status IN ('pending', 'confirmed') 
         AND NEW.status NOT IN ('pending', 'confirmed')
         AND OLD.slot_id IS NOT NULL THEN
        UPDATE availability_slots 
        SET booked = GREATEST(0, booked - 1)
        WHERE id = OLD.slot_id;
        RAISE NOTICE 'Trigger ejecutado: UPDATE - Slot % liberado por cambio de estado', OLD.slot_id;
      -- Si pasó de inactivo a activo
      ELSIF OLD.status NOT IN ('pending', 'confirmed')
            AND NEW.status IN ('pending', 'confirmed')
            AND NEW.slot_id IS NOT NULL THEN
        UPDATE availability_slots 
        SET booked = booked + 1
        WHERE id = NEW.slot_id;
        RAISE NOTICE 'Trigger ejecutado: UPDATE - Slot % reservado por cambio de estado', NEW.slot_id;
      END IF;
    END IF;
    RETURN NEW;
  
  -- Para DELETE: Decrementar contador si la cita estaba activa
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('pending', 'confirmed') AND OLD.slot_id IS NOT NULL THEN
      UPDATE availability_slots 
      SET booked = GREATEST(0, booked - 1)
      WHERE id = OLD.slot_id;
      RAISE NOTICE 'Trigger ejecutado: DELETE - Slot % liberado', OLD.slot_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Recrear el trigger con SECURITY DEFINER para asegurar que tenga permisos
CREATE TRIGGER trg_update_slot_booking
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_slot_booking();

-- 4. Verificar que el trigger fue creado
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'appointments'
AND trigger_name = 'trg_update_slot_booking';

-- 5. Sincronizar todos los contadores manualmente primero
UPDATE availability_slots s
SET booked = LEAST(
    s.capacity,
    (
        SELECT COUNT(*)
        FROM appointments a
        WHERE a.slot_id = s.id
          AND a.status IN ('pending', 'confirmed')
    )
)
WHERE s.date >= CURRENT_DATE;

-- 6. Verificar estado actual del slot de 11:30
SELECT
    s.id as slot_id,
    s.date,
    s.start_time,
    s.capacity,
    s.booked as current_booked_count,
    COUNT(a.id) FILTER (WHERE a.status IN ('pending', 'confirmed')) as citas_activas_count,
    CASE
        WHEN s.booked >= s.capacity THEN 'X COMPLETO'
        WHEN s.booked > 0 THEN 'A PARCIALMENTE OCUPADO'
        ELSE '✓ DISPONIBLE'
    END as estado_slot
FROM availability_slots s
LEFT JOIN appointments a ON a.slot_id = s.id
WHERE s.date = '2025-12-01'
AND s.start_time = '11:30:00'
GROUP BY s.id, s.date, s.start_time, s.capacity, s.booked;

