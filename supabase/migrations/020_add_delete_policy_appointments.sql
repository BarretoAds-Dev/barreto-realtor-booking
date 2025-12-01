-- Agregar política DELETE para appointments
-- Esto permite que el rol 'public' pueda eliminar citas (necesario para el CRM)

-- Verificar si la política ya existe antes de crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'public_delete_appointments' 
        AND tablename = 'appointments'
    ) THEN
        -- Crear política DELETE que permita eliminar cualquier cita
        CREATE POLICY "public_delete_appointments"
        ON appointments FOR DELETE
        TO public
        USING (true);
        
        RAISE NOTICE 'Política DELETE creada exitosamente para appointments';
    ELSE
        RAISE NOTICE 'La política DELETE ya existe para appointments';
    END IF;
END
$$;

-- Verificar que la política fue creada
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
WHERE tablename = 'appointments'
ORDER BY cmd, policyname;

