-- Asegurar que el agente por defecto existe
INSERT INTO agents (id, name, email, phone, office_location)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Agente Principal',
  'agente@coldwellbanker.com',
  '+52 55 1234 5678',
  'Ciudad de México'
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  office_location = EXCLUDED.office_location;

-- Verificar que el agente existe
SELECT id, name, email FROM agents WHERE id = '00000000-0000-0000-0000-000000000001';

