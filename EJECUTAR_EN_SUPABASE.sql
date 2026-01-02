-- ============================================
-- ⚠️ EJECUTA ESTO EN SUPABASE SQL EDITOR
-- ============================================
-- 1. Ve a: https://app.supabase.com
-- 2. Selecciona tu proyecto RecaudoPro
-- 3. Click en "SQL Editor" → "New Query"
-- 4. Copia TODO este código y pégalo
-- 5. Click en "Run" o Ctrl+Enter
-- ============================================

-- Crear función RPC para obtener usuarios por business_id
-- Esta función NO modifica tablas, solo crea una función nueva
-- Es segura y no afecta otras funcionalidades

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

-- Otorgar permisos para que la aplicación web pueda ejecutarla
GRANT EXECUTE ON FUNCTION get_users_by_business_id(UUID) TO anon, authenticated;

-- Agregar comentario
COMMENT ON FUNCTION get_users_by_business_id(UUID) IS 'Obtiene usuarios por business_id para login web. Bypasea RLS usando SECURITY DEFINER.';

-- ============================================
-- VERIFICACIÓN (ejecuta esto después para probar)
-- ============================================
-- SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');

