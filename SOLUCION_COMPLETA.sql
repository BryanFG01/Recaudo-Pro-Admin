-- ============================================
-- SOLUCIÓN COMPLETA PARA LOGIN WEB
-- ============================================
-- Este script crea la función RPC necesaria para el login web
-- NO modifica tablas existentes, solo crea una función
-- Ejecuta TODO este código en Supabase SQL Editor
-- ============================================

-- Paso 1: Crear la función RPC para obtener usuarios por business_id
CREATE OR REPLACE FUNCTION get_users_by_business_id(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  business_id UUID,
  employee_code TEXT,
  phone TEXT,
  role TEXT,
  commission_percentage NUMERIC,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.avatar_url,
    u.business_id,
    u.employee_code,
    u.phone,
    u.role,
    u.commission_percentage,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.business_id = p_business_id
  ORDER BY u.email;
END;
$$;

-- Paso 2: Otorgar permisos para que la aplicación web pueda ejecutarla
GRANT EXECUTE ON FUNCTION get_users_by_business_id(UUID) TO anon, authenticated;

-- Paso 3: Agregar comentario descriptivo
COMMENT ON FUNCTION get_users_by_business_id(UUID) IS 'Obtiene usuarios por business_id para login web. Bypasea RLS usando SECURITY DEFINER.';

-- ============================================
-- VERIFICACIÓN (ejecuta esto después)
-- ============================================
-- Verificar que la función existe:
-- SELECT routine_name, security_type FROM information_schema.routines WHERE routine_name = 'get_users_by_business_id';
--
-- Probar la función:
-- SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');

