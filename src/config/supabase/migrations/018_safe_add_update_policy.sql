-- Agregar política UPDATE para availability_slots de forma segura (sin DROP)

-- Verificar si la política ya existe
DO $$
BEGIN
    -- Si la política no existe, crearla
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'availability_slots' 
        AND policyname = 'Allow trigger to update booked'
    ) THEN
        -- Crear política UPDATE que permita actualizar
        CREATE POLICY "Allow trigger to update booked"
        ON availability_slots FOR UPDATE
        TO public
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'Política UPDATE creada exitosamente';
    ELSE
        RAISE NOTICE 'La política UPDATE ya existe';
    END IF;
END $$;

-- Verificar políticas existentes para availability_slots
SELECT 
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'availability_slots'
ORDER BY cmd, policyname;

