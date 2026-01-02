-- ============================================
-- FUNCIÓN RPC PARA LOGIN WEB
-- ============================================
-- Esta función permite obtener usuarios por business_id
-- Solo para uso en la aplicación web, no afecta otras funcionalidades
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

-- Crear la función RPC (si ya existe, la reemplaza)
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

-- Otorgar permisos para que la aplicación web pueda usarla
GRANT EXECUTE ON FUNCTION get_users_by_business_id(UUID) TO anon, authenticated;

-- Comentario descriptivo
COMMENT ON FUNCTION get_users_by_business_id(UUID) IS 'Obtiene todos los usuarios asociados a un business_id para el login web. Bypasea RLS usando SECURITY DEFINER.';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, verifica con:
-- SELECT routine_name, security_type FROM information_schema.routines WHERE routine_name = 'get_users_by_business_id';
-- 
-- Prueba la función con:
-- SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');

