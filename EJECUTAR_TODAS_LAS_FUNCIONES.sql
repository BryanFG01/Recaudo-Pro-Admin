-- ============================================
-- ⚠️ EJECUTA ESTO COMPLETO EN SUPABASE SQL EDITOR
-- ============================================
-- Elimina y recrea TODAS las funciones RPC necesarias
-- ============================================

-- PASO 1: Eliminar TODAS las funciones existentes
DROP FUNCTION IF EXISTS get_credits_by_business_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_collections_by_business_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_clients_by_business_id(UUID) CASCADE;

-- PASO 2: Crear función para obtener créditos por business_id
CREATE FUNCTION get_credits_by_business_id(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  total_amount DOUBLE PRECISION,
  installment_amount DOUBLE PRECISION,
  total_installments INTEGER,
  paid_installments INTEGER,
  overdue_installments INTEGER,
  total_balance DOUBLE PRECISION,
  last_payment_amount DOUBLE PRECISION,
  last_payment_date TIMESTAMPTZ,
  next_due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  business_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.client_id,
    c.total_amount,
    c.installment_amount,
    c.total_installments,
    c.paid_installments,
    c.overdue_installments,
    c.total_balance,
    c.last_payment_amount,
    c.last_payment_date,
    c.next_due_date,
    c.created_at,
    c.updated_at,
    c.business_id
  FROM credits c
  WHERE c.business_id = p_business_id
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_credits_by_business_id(UUID) TO anon, authenticated;

-- PASO 3: Crear función para obtener collections por business_id
CREATE FUNCTION get_collections_by_business_id(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  credit_id UUID,
  client_id UUID,
  amount DOUBLE PRECISION,
  payment_date TIMESTAMPTZ,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  business_id UUID,
  payment_method TEXT,
  transaction_reference TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    col.id,
    col.credit_id,
    col.client_id,
    col.amount,
    col.payment_date,
    col.notes,
    col.user_id,
    col.created_at,
    col.business_id,
    col.payment_method,
    col.transaction_reference
  FROM collections col
  WHERE col.business_id = p_business_id
  ORDER BY col.payment_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_collections_by_business_id(UUID) TO anon, authenticated;

-- PASO 4: Crear función para obtener clients por business_id
CREATE FUNCTION get_clients_by_business_id(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  document_id TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  business_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.name,
    cl.phone,
    cl.document_id,
    cl.address,
    cl.latitude,
    cl.longitude,
    cl.created_at,
    cl.updated_at,
    cl.business_id
  FROM clients cl
  WHERE cl.business_id = p_business_id
  ORDER BY cl.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_clients_by_business_id(UUID) TO anon, authenticated;

-- ============================================
-- VERIFICACIÓN (ejecuta esto después para probar)
-- ============================================
-- SELECT * FROM get_credits_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297'::UUID);
-- SELECT * FROM get_collections_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297'::UUID);
-- SELECT * FROM get_clients_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297'::UUID);

