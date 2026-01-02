-- ============================================
-- ⚠️ EJECUTA ESTO EN SUPABASE SQL EDITOR AHORA
-- ============================================
-- Copia TODO este código y pégalo en Supabase SQL Editor
-- Luego presiona Run o Ctrl+Enter
-- ============================================

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

GRANT EXECUTE ON FUNCTION get_users_by_business_id(UUID) TO anon, authenticated;

-- ============================================
-- PRUEBA: Ejecuta esto después para verificar
-- ============================================
-- SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');

