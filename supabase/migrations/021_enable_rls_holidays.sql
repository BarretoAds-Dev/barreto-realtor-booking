-- Habilitar Row Level Security en la tabla holidays
-- Esta migración resuelve la advertencia de seguridad de Supabase

-- 1. Habilitar RLS en la tabla holidays
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- 2. Crear política para que cualquiera pueda leer los días festivos (público)
-- Esto es necesario porque los días festivos son información pública que necesita
-- estar disponible para el calendario de citas
CREATE POLICY "public_select_holidays"
ON holidays FOR SELECT
TO public
USING (true);

-- 3. Crear política para que usuarios autenticados puedan insertar días festivos
-- Solo administradores/agentes deberían poder agregar días festivos
CREATE POLICY "authenticated_insert_holidays"
ON holidays FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Crear política para que usuarios autenticados puedan actualizar días festivos
CREATE POLICY "authenticated_update_holidays"
ON holidays FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Crear política para que usuarios autenticados puedan eliminar días festivos
CREATE POLICY "authenticated_delete_holidays"
ON holidays FOR DELETE
TO authenticated
USING (true);

-- Verificar que RLS está habilitado y las políticas están creadas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'holidays'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS no está habilitado en la tabla holidays';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'holidays'
    ) THEN
        RAISE EXCEPTION 'No se encontraron políticas en la tabla holidays';
    END IF;
END $$;

