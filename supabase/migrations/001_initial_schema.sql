-- Migración inicial: Schema completo del sistema de citas
-- Ejecutar con: npx supabase db reset (en desarrollo) o aplicar en producción

-- Tabla de agentes (inmobiliarios)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  office_location TEXT,
  calendar_integration JSONB, -- Google Calendar, Outlook, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de disponibilidad dinámica
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER DEFAULT 1,
  booked INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_capacity CHECK (booked <= capacity),
  UNIQUE(agent_id, date, start_time)
);

-- Índices para queries rápidos
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability_slots(date, enabled) 
  WHERE enabled = TRUE AND booked < capacity;
CREATE INDEX IF NOT EXISTS idx_availability_agent_date ON availability_slots(agent_id, date);

-- Tabla de citas reservadas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  slot_id UUID REFERENCES availability_slots(id),
  
  -- Datos del cliente
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Información de la operación
  operation_type TEXT NOT NULL CHECK (operation_type IN ('rentar', 'comprar')),
  budget_range TEXT NOT NULL,
  
  -- Detalles según tipo
  company TEXT, -- Para rentar
  resource_type TEXT, -- Para comprar: recursos-propios, credito-bancario, etc.
  resource_details JSONB, -- Banco, modalidad, número trabajador, etc.
  
  -- Información de la cita
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(client_email);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(slot_id);

-- Tabla de días festivos
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'holiday' CHECK (type IN ('holiday', 'vacation', 'blocked')),
  recurring BOOLEAN DEFAULT FALSE
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar availability_slots.booked cuando se crea/cancela una cita
CREATE OR REPLACE FUNCTION update_slot_booking()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_slot_booking
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_slot_booking();

-- Row Level Security (para futuro multi-tenant)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden insertar citas (formulario público)
CREATE POLICY "Anyone can create appointments"
ON appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política: Todos pueden ver slots disponibles
CREATE POLICY "Anyone can view available slots"
ON availability_slots FOR SELECT
TO anon, authenticated
USING (enabled = TRUE);

-- Política: Solo agentes autenticados pueden ver todas las citas
CREATE POLICY "Agents can view all appointments"
ON appointments FOR SELECT
TO authenticated
USING (true);

-- Política: Solo agentes autenticados pueden actualizar citas
CREATE POLICY "Agents can update appointments"
ON appointments FOR UPDATE
TO authenticated
USING (true);

-- Insertar agente por defecto (para desarrollo)
INSERT INTO agents (id, name, email, phone, office_location)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Agente Principal',
  'agente@coldwellbanker.com',
  '+52 55 1234 5678',
  'Ciudad de México'
)
ON CONFLICT (email) DO NOTHING;

