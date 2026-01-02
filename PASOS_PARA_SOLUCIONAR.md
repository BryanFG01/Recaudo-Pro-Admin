# 🔧 PASOS PARA SOLUCIONAR EL ERROR

## ❌ Error Actual
```
Error al obtener usuarios: No se encontraron usuarios para el business_id: "6fb48a52-addb-4d95-8dea-ea87485d0297"
```

## 🔍 Causa del Problema
Las políticas RLS (Row Level Security) de Supabase están bloqueando la consulta directa a la tabla `users`. Necesitas crear una función RPC que bypasee RLS.

## ✅ SOLUCIÓN: Ejecutar SQL en Supabase

### Paso 1: Abre Supabase Dashboard
1. Ve a: https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **RecaudoPro**

### Paso 2: Abre SQL Editor
1. En el menú lateral izquierdo, busca **SQL Editor**
2. Haz clic en **SQL Editor**
3. Haz clic en **New Query** (botón verde arriba a la derecha)

### Paso 3: Copia el SQL
1. Abre el archivo **`EJECUTAR_AHORA.sql`** en este proyecto
2. Selecciona TODO el contenido (desde `CREATE OR REPLACE FUNCTION` hasta `GRANT EXECUTE`)
3. Copia (Ctrl+C)

### Paso 4: Pega y Ejecuta
1. Pega el código en el editor SQL de Supabase (Ctrl+V)
2. Verifica que se vea completo
3. Haz clic en **Run** (botón azul) o presiona **Ctrl+Enter**
4. Espera unos segundos

### Paso 5: Verifica que Funcionó
Deberías ver un mensaje verde: **"Success. No rows returned"**

### Paso 6: Prueba la Función
En el mismo SQL Editor, ejecuta esto para verificar:

```sql
SELECT * FROM get_users_by_business_id('6fb48a52-addb-4d95-8dea-ea87485d0297');
```

Deberías ver el usuario `test@recaudopro.com` en los resultados.

### Paso 7: Prueba el Login
1. Recarga la página de login en tu aplicación web
2. Ingresa el business_id: `6fb48a52-addb-4d95-8dea-ea87485d0297`
3. Deberías ver la lista de emails disponibles
4. Selecciona un email e ingresa la contraseña

## ⚠️ IMPORTANTE

- **Sin ejecutar este SQL, el login NO funcionará** porque RLS bloquea las consultas directas
- La función debe crearse UNA SOLA VEZ en Supabase
- Una vez creada, funcionará para siempre

## 🆘 Si Tienes Problemas

### Error al ejecutar el SQL:
- Verifica que tengas permisos de administrador en Supabase
- Asegúrate de copiar TODO el código completo
- Verifica que no haya errores de sintaxis

### La función se crea pero sigue sin funcionar:
- Espera unos segundos y recarga la página
- Verifica que la función existe ejecutando:
  ```sql
  SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_users_by_business_id';
  ```

