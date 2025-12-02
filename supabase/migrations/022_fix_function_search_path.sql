-- Corregir el search_path de las funciones para seguridad
-- Esto resuelve las advertencias de "Function Search Path Mutable"

-- 1. Corregir update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Corregir update_slot_booking
CREATE OR REPLACE FUNCTION update_slot_booking()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('pending', 'confirmed') THEN
    UPDATE availability_slots 
    SET booked = booked + 1 
    WHERE id = NEW.slot_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambia de activo a cancelado/no-show, liberar slot
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('cancelled', 'no-show') THEN
      UPDATE availability_slots 
      SET booked = GREATEST(0, booked - 1)
      WHERE id = OLD.slot_id;
    -- Si cambia de cancelado a activo, ocupar slot
    ELSIF OLD.status IN ('cancelled', 'no-show') AND NEW.status IN ('pending', 'confirmed') THEN
      UPDATE availability_slots 
      SET booked = booked + 1 
      WHERE id = NEW.slot_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Si se elimina una cita activa, liberar slot
    IF OLD.status IN ('pending', 'confirmed') THEN
      UPDATE availability_slots 
      SET booked = GREATEST(0, booked - 1)
      WHERE id = OLD.slot_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 3. Corregir generate_availability_slots
CREATE OR REPLACE FUNCTION generate_availability_slots(
  p_agent_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_open_time TIME,
  p_close_time TIME,
  p_slot_duration_minutes INTEGER DEFAULT 45,
  p_days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_date DATE;
  cur_time TIME;
  slot_start TIME;
  slot_end TIME;
  slots_created INTEGER := 0;
  day_of_week INTEGER;
BEGIN
  cur_date := p_start_date;
  
  WHILE cur_date <= p_end_date LOOP
    -- Obtener día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
    day_of_week := EXTRACT(DOW FROM cur_date);
    
    -- Verificar si el día está en la lista de días habilitados
    IF day_of_week = ANY(p_days_of_week) THEN
      -- Inicializar tiempo de inicio
      slot_start := p_open_time;
      
      -- Generar slots hasta el tiempo de cierre
      WHILE slot_start < p_close_time LOOP
        -- Calcular tiempo de fin del slot
        slot_end := slot_start + (p_slot_duration_minutes || ' minutes')::INTERVAL;
        
        -- Solo crear slot si no excede el tiempo de cierre
        IF slot_end <= p_close_time THEN
          INSERT INTO availability_slots (
            agent_id,
            date,
            start_time,
            end_time,
            capacity,
            booked,
            enabled
          )
          VALUES (
            p_agent_id,
            cur_date,
            slot_start::TIME,
            slot_end::TIME,
            1,
            0,
            TRUE
          )
          ON CONFLICT (agent_id, date, start_time) DO NOTHING;
          
          slots_created := slots_created + 1;
        END IF;
        
        -- Avanzar al siguiente slot
        slot_start := slot_end;
      END LOOP;
    END IF;
    
    -- Avanzar al siguiente día
    cur_date := cur_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN slots_created;
END;
$$;

-- Verificar que las funciones tienen search_path configurado
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_updated_at_column', 'update_slot_booking', 'generate_availability_slots')
ORDER BY p.proname;

