# Crear Función RPC en Supabase

## Problema
Las políticas RLS (Row Level Security) están bloqueando la consulta directa a la tabla `users`. Necesitas crear una función RPC que bypasee RLS.

## Solución

### Paso 1: Abre Supabase SQL Editor
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**

### Paso 2: Ejecuta este SQL

Copia y pega el siguiente código SQL y ejecútalo:

```sql
-- Función RPC para obtener usuarios por business_id
-- Esta función bypasea las políticas RLS (Row Level Security)

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

-- Otorgar permisos de ejecución a los roles anon y authenticated
GRANT EXECUTE ON FUNCTION get_users_by_business_id(UUID) TO anon, authenticated;

-- Comentario de la función
COMMENT ON FUNCTION get_users_by_business_id(UUID) IS 'Obtiene todos los usuarios asociados a un business_id, bypaseando RLS para permitir el login';
```

### Paso 3: Verificar que la función se creó

Ejecuta esta consulta para verificar:

```sql
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_business_id';
```

Deberías ver una fila con `security_type = 'DEFINER'`.

### Paso 4: Probar la función

Ejecuta esta consulta para probar la función:

```sql
SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');
```

Deberías ver los usuarios asociados a ese business_id.

## Verificar Business ID

Si quieres verificar que el business_id existe, ejecuta:

```sql
SELECT id, name FROM businesses WHERE id = '6fb48a52-addb-4d95-8dea-ea87485d0297';
```

Y para ver los usuarios:

```sql
SELECT email, business_id, is_active 
FROM users 
WHERE business_id = '6fb48a52-addb-4d95-8dea-ea87485d0297';
```

## Notas Importantes

- La función usa `SECURITY DEFINER` lo que significa que ejecuta con los permisos del creador de la función, bypaseando RLS
- Los permisos están otorgados a `anon` y `authenticated` para que puedan ejecutarla desde el frontend
- Una vez creada la función, el login debería funcionar correctamente

