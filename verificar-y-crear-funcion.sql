-- ============================================
-- Script para verificar business_id y crear función RPC
-- Ejecuta este script completo en Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR QUE EXISTE EL BUSINESS_ID
SELECT 
  id, 
  name,
  created_at
FROM businesses 
WHERE id = '6fb48a52-addb-4d95-8dea-ea87485d0297';

-- 2. VERIFICAR USUARIOS CON ESE BUSINESS_ID
SELECT 
  email, 
  business_id, 
  is_active,
  role,
  name
FROM users 
WHERE business_id = '6fb48a52-addb-4d95-8dea-ea87485d0297'
ORDER BY email;

-- 3. CREAR LA FUNCIÓN RPC (si no existe)
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

-- 4. OTORGAR PERMISOS
GRANT EXECUTE ON FUNCTION get_users_by_business_id(UUID) TO anon, authenticated;

-- 5. VERIFICAR QUE LA FUNCIÓN SE CREÓ CORRECTAMENTE
SELECT 
  routine_name, 
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_business_id';

-- 6. PROBAR LA FUNCIÓN
SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');

