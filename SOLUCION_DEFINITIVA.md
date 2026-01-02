# 🔧 SOLUCIÓN DEFINITIVA: Por qué no funciona y cómo arreglarlo

## 🔍 Análisis del Problema

### Flujo Anterior (Funcionaba) ✅
1. Usuario ingresaba: `business_id`, `email`, `password`
2. Se llamaba a `authenticate_user` RPC (función que ya existe)
3. Esta función usa `SECURITY DEFINER` y bypasea RLS
4. ✅ Funcionaba porque la función RPC ya estaba creada

### Flujo Nuevo (No funciona) ❌
1. Usuario ingresa solo `business_id`
2. Intenta obtener lista de usuarios consultando tabla `users` directamente
3. ❌ Falla porque RLS bloquea consultas directas a `users` sin autenticación
4. Necesita función RPC `get_users_by_business_id` que NO existe todavía

## ✅ SOLUCIÓN: Crear la Función RPC

La función `authenticate_user` ya existe y funciona. Necesitas crear una función similar para listar usuarios.

### Paso 1: Abre Supabase SQL Editor
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Click en **SQL Editor** → **New Query**

### Paso 2: Ejecuta este SQL (COPIA TODO)

```sql
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
```

### Paso 3: Verificar

Ejecuta esto para verificar que se creó:

```sql
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_business_id';
```

Deberías ver: `security_type = 'DEFINER'`

### Paso 4: Probar

```sql
SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');
```

Deberías ver el usuario `test@recaudopro.com`

## ⚠️ IMPORTANTE

- **Sin esta función, el nuevo flujo NO funcionará** porque RLS bloquea consultas directas
- La función debe usar `SECURITY DEFINER` para bypasear RLS (igual que `authenticate_user`)
- Los permisos `GRANT EXECUTE` permiten que el frontend la llame

## 🔄 Alternativa Temporal

Si no puedes crear la función ahora, puedes volver al flujo anterior donde se ingresa directamente email, password y business_id.

