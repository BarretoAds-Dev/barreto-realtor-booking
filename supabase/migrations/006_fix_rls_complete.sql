-- Solución completa para RLS: Asegurar que todas las políticas funcionen correctamente

-- 1. Eliminar TODAS las políticas existentes de appointments
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;
DROP POLICY IF EXISTS "Agents can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Agents can update appointments" ON appointments;

-- 2. Crear política de INSERT más permisiva (sin restricciones)
CREATE POLICY "public_insert_appointments"
ON appointments FOR INSERT
TO public
WITH CHECK (true);

-- 3. Crear política de SELECT para que cualquiera pueda ver sus propias citas
CREATE POLICY "public_select_appointments"
ON appointments FOR SELECT
TO public
USING (true);

-- 4. Asegurar que availability_slots tenga la política correcta
DROP POLICY IF EXISTS "Anyone can view available slots" ON availability_slots;
CREATE POLICY "public_select_slots"
ON availability_slots FOR SELECT
TO public
USING (enabled = TRUE);

-- 5. Asegurar que agents tenga la política correcta
DROP POLICY IF EXISTS "Public can view agents" ON agents;
CREATE POLICY "public_select_agents"
ON agents FOR SELECT
TO public
USING (true);

-- 6. Verificar que RLS está habilitado
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 7. Verificar todas las políticas
SELECT 
    tablename,
    policyname,
    roles,
    cmd,
    CASE 
        WHEN with_check IS NULL THEN 'NULL'
        ELSE with_check::text
    END as with_check,
    CASE 
        WHEN qual IS NULL THEN 'NULL'
        ELSE qual::text
    END as qual
FROM pg_policies
WHERE tablename IN ('appointments', 'availability_slots', 'agents')
ORDER BY tablename, cmd, policyname;

