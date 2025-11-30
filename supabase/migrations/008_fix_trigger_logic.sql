-- Corregir el trigger para asegurar que actualice correctamente el campo 'booked'

-- Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS trg_update_slot_booking ON appointments;
DROP FUNCTION IF EXISTS update_slot_booking();

-- Recrear la función del trigger con lógica mejorada
CREATE OR REPLACE FUNCTION update_slot_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT: Incrementar contador si la cita está activa
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('pending', 'confirmed') AND NEW.slot_id IS NOT NULL THEN
      UPDATE availability_slots 
      SET booked = booked + 1 
      WHERE id = NEW.slot_id;
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
      END IF;
      -- Reservar el nuevo slot si está activo
      IF NEW.status IN ('pending', 'confirmed') AND NEW.slot_id IS NOT NULL THEN
        UPDATE availability_slots 
        SET booked = booked + 1
        WHERE id = NEW.slot_id;
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
      -- Si pasó de inactivo a activo
      ELSIF OLD.status NOT IN ('pending', 'confirmed')
            AND NEW.status IN ('pending', 'confirmed')
            AND NEW.slot_id IS NOT NULL THEN
        UPDATE availability_slots 
        SET booked = booked + 1
        WHERE id = NEW.slot_id;
      END IF;
    END IF;
    RETURN NEW;
  
  -- Para DELETE: Decrementar contador si la cita estaba activa
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('pending', 'confirmed') AND OLD.slot_id IS NOT NULL THEN
      UPDATE availability_slots 
      SET booked = GREATEST(0, booked - 1)
      WHERE id = OLD.slot_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
CREATE TRIGGER trg_update_slot_booking
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_slot_booking();

-- Sincronizar contadores manualmente para citas existentes
-- Esto corrige cualquier inconsistencia previa
UPDATE availability_slots s
SET booked = (
  SELECT COUNT(*)
  FROM appointments a
  WHERE a.slot_id = s.id
    AND a.status IN ('pending', 'confirmed')
);

-- Verificar que los contadores están correctos
SELECT 
    s.id,
    s.date,
    s.start_time,
    s.capacity,
    s.booked,
    COUNT(a.id) as actual_appointments
FROM availability_slots s
LEFT JOIN appointments a ON a.slot_id = s.id 
    AND a.status IN ('pending', 'confirmed')
WHERE s.date >= CURRENT_DATE
GROUP BY s.id, s.date, s.start_time, s.capacity, s.booked
HAVING s.booked != COUNT(a.id)
LIMIT 10;

