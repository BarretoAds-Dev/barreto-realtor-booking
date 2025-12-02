-- Migración para poblar slots iniciales basados en horarios de negocio
-- Este script genera slots automáticamente para los próximos 6 meses

-- Función para generar slots de disponibilidad
CREATE OR REPLACE FUNCTION generate_availability_slots(
  p_agent_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_open_time TIME,
  p_close_time TIME,
  p_slot_duration_minutes INTEGER DEFAULT 45,
  p_days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6] -- Lunes a Sábado
)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Poblar slots para los próximos 6 meses
-- Horario: Lunes a Sábado, 10:00 AM - 5:00 PM, slots de 45 minutos
DO $$
DECLARE
  agent_id UUID := '00000000-0000-0000-0000-000000000001';
  start_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '6 months';
  slots_count INTEGER;
BEGIN
  -- Generar slots para lunes a sábado (1-6)
  slots_count := generate_availability_slots(
    agent_id,
    start_date,
    end_date,
    '10:00'::TIME,
    '17:00'::TIME,
    45,
    ARRAY[1,2,3,4,5,6] -- Lunes a Sábado
  );
  
  RAISE NOTICE 'Creados % slots de disponibilidad', slots_count;
END $$;

-- Insertar días festivos existentes
INSERT INTO holidays (date, name, type, recurring)
VALUES
  ('2025-01-01', 'Año Nuevo', 'holiday', TRUE),
  ('2025-05-01', 'Día del Trabajo', 'holiday', TRUE),
  ('2025-12-25', 'Navidad', 'holiday', TRUE)
ON CONFLICT (date) DO NOTHING;

-- Deshabilitar slots en días festivos
UPDATE availability_slots
SET enabled = FALSE
WHERE date IN (SELECT date FROM holidays);

