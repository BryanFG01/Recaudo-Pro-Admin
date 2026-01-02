# ⚠️ INSTRUCCIONES URGENTES: Crear Función RPC

## 🔴 Problema Actual
Las políticas RLS (Row Level Security) están bloqueando la consulta a la tabla `users`. Por eso no puedes ver los usuarios aunque existan en la base de datos.

## ✅ Solución: Crear Función RPC

### Paso 1: Abre Supabase SQL Editor
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto **RecaudoPro**
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**

### Paso 2: Copia y Ejecuta este SQL

**OPCIÓN A: Usar el archivo SQL**
1. Abre el archivo `supabase-function-get-users-by-business-id.sql` en tu proyecto
2. Copia TODO el contenido
3. Pégalo en Supabase SQL Editor
4. Haz clic en **Run** o presiona `Ctrl+Enter`

**OPCIÓN B: Copiar directamente**

Copia y pega este código SQL completo:

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

COMMENT ON FUNCTION get_users_by_business_id(UUID) IS 'Obtiene todos los usuarios asociados a un business_id, bypaseando RLS para permitir el login';
```

### Paso 3: Verificar que se creó correctamente

Ejecuta esta consulta para verificar:

```sql
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_name = 'get_users_by_business_id';
```

Deberías ver una fila con `security_type = 'DEFINER'`.

### Paso 4: Probar la función

Ejecuta esta consulta para probar:

```sql
SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');
```

Deberías ver el usuario `test@recaudopro.com`.

### Paso 5: Probar el Login

1. Recarga la aplicación web
2. Intenta iniciar sesión con el business_id: `6fb48a52-addb-4d95-8dea-ea87485d0297`
3. Deberías ver la lista de emails disponibles

## 🔍 Verificar Business ID y Usuarios

Si quieres verificar que todo existe antes de crear la función:

```sql
-- Verificar business
SELECT id, name FROM businesses WHERE id = '6fb48a52-addb-4d95-8dea-ea87485d0297';

-- Verificar usuarios
SELECT email, business_id, is_active, role 
FROM users 
WHERE business_id = '6fb48a52-addb-4d95-8dea-ea87485d0297';
```

## ⚠️ Importante

- La función usa `SECURITY DEFINER` lo que significa que ejecuta con permisos elevados, bypaseando RLS
- Los permisos están otorgados a `anon` y `authenticated` para que funcione desde el frontend
- **SIN esta función, el login NO funcionará** porque RLS bloquea las consultas directas

## 📝 Notas

- Si ves algún error al ejecutar el SQL, verifica que tengas permisos de administrador en Supabase
- La función debe crearse en el esquema `public`
- Una vez creada, el código de la aplicación la usará automáticamente

