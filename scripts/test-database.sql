-- 🧪 Scripts SQL para Verificar la Base de Datos
-- Ejecuta estos queries en Supabase SQL Editor para verificar que todo funciona

-- 1. VERIFICAR ESTRUCTURA DE TABLAS
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('agents', 'availability_slots', 'appointments', 'properties', 'clients', 'holidays')
        THEN '✅ Existe'
        ELSE '⚠️ No esperada'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('agents', 'availability_slots', 'appointments', 'properties', 'clients', 'holidays')
ORDER BY table_name;

-- 2. CONTAR REGISTROS
SELECT 
    'agents' as tabla, COUNT(*) as total FROM agents
UNION ALL SELECT 'availability_slots', COUNT(*) FROM availability_slots
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'properties', COUNT(*) FROM properties
UNION ALL SELECT 'clients', COUNT(*) FROM clients;

-- 3. VERIFICAR SLOTS DISPONIBLES
SELECT 
    date,
    COUNT(*) as total_slots,
    SUM(CASE WHEN booked < capacity AND enabled = true THEN 1 ELSE 0 END) as disponibles
FROM availability_slots
WHERE date >= CURRENT_DATE AND date <= CURRENT_DATE + INTERVAL '7 days'
GROUP BY date
ORDER BY date;

-- 4. VERIFICAR CITAS POR ESTADO
SELECT status, COUNT(*) as total
FROM appointments
GROUP BY status
ORDER BY total DESC;
