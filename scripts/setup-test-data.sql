-- 🧪 Script para Crear Datos de Prueba
-- ⚠️ ADVERTENCIA: Solo usar en desarrollo

-- 1. CREAR AGENTE DE PRUEBA
INSERT INTO agents (id, name, email, phone, office_location)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Agente de Prueba',
    'agente@test.com',
    '+52 555 123 4567',
    'Oficina Central'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- 2. CREAR CLIENTE DE PRUEBA
INSERT INTO clients (name, email, phone)
VALUES (
    'Cliente de Prueba',
    'cliente@test.com',
    '+52 555 987 6543'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;

-- 3. CREAR PROPIEDAD DE PRUEBA
INSERT INTO properties (title, address, price, property_type, bedrooms, bathrooms, status)
VALUES (
    'Casa de Prueba',
    'Av. Principal 123, CDMX',
    2500000,
    'Casa',
    3,
    2,
    'active'
)
ON CONFLICT DO NOTHING;

SELECT '✅ Datos de prueba creados' as status;
