import { IAuthRepository } from '../../domain/port'
import { SignInRequest, SignInResponse, User, CreateUserRequest } from '../../domain/models'
import { supabase } from '@/shared/config/supabase'

export class AuthRepository implements IAuthRepository {
  async signInWithEmail(request: SignInRequest): Promise<SignInResponse> {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_business_id: request.businessId,
        p_email: request.email.trim(),
        p_password: request.password,
      })

      if (error || !data || data.length === 0) {
        throw new Error('Credenciales inválidas')
      }

      const user = data[0] as User

      return {
        user,
        success: true,
      }
    } catch (error) {
      throw new Error(`Error al iniciar sesión: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  async getUsersByBusinessId(businessId: string): Promise<User[]> {
    try {
      // Limpiar el business_id de espacios en blanco
      const cleanBusinessId = businessId.trim()

      if (!cleanBusinessId) {
        throw new Error('ID de negocio no puede estar vacío')
      }

      // Intentar primero con función RPC si existe (bypasea RLS)
      try {
        const { data: rpcUsers, error: rpcError } = await supabase.rpc('get_users_by_business_id', {
          p_business_id: cleanBusinessId,
        })

        if (!rpcError && rpcUsers) {
          if (rpcUsers.length > 0) {
            return rpcUsers as User[]
          } else {
            // La función existe pero no hay usuarios, continuar con consulta directa
            console.log('Función RPC ejecutada pero no hay usuarios, intentando consulta directa')
          }
        } else if (rpcError) {
          // Si el error es que la función no existe
          if (rpcError.code === 'PGRST202' || rpcError.message.includes('Could not find the function')) {
            console.error('❌ Función RPC no existe.')
            console.error('📄 SOLUCIÓN: Abre el archivo "SOLUCION_COMPLETA.sql"')
            console.error('📋 Copia TODO el contenido y ejecútalo en Supabase SQL Editor')
            console.error('🔗 Ve a: https://app.supabase.com → Tu Proyecto → SQL Editor')
            // Continuar con consulta directa (probablemente fallará por RLS)
          } else {
            // Otro tipo de error en la función RPC
            console.error('Error en función RPC:', rpcError)
            throw new Error(`Error en función RPC: ${rpcError.message}`)
          }
        }
      } catch (rpcErr) {
        // Si la función RPC no existe, continuar con consulta directa
        console.log('Función RPC no disponible, usando consulta directa')
      }

      // Consultar usuarios activos primero
      const { data: activeUsers, error: activeError } = await supabase
        .from('users')
        .select('*')
        .eq('business_id', cleanBusinessId)
        .eq('is_active', true)
        .order('email', { ascending: true })

      // Si hay usuarios activos, retornarlos
      if (!activeError && activeUsers && activeUsers.length > 0) {
        return activeUsers as User[]
      }

      // Si no hay usuarios activos, consultar todos (incluyendo inactivos)
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('*')
        .eq('business_id', cleanBusinessId)
        .order('email', { ascending: true })

      if (allUsersError) {
        // Si hay un error específico de RLS o permisos
        const errorMsg = allUsersError.message.toLowerCase()
        if (errorMsg.includes('permission') || errorMsg.includes('rls') || errorMsg.includes('policy')) {
          throw new Error(
            `Error de permisos (RLS): Las políticas de seguridad están bloqueando la consulta.\n\n` +
            `Solución: Crea una función RPC en Supabase con el siguiente código:\n\n` +
            `CREATE OR REPLACE FUNCTION get_users_by_business_id(p_business_id UUID)\n` +
            `RETURNS TABLE (\n` +
            `  id UUID,\n` +
            `  email TEXT,\n` +
            `  name TEXT,\n` +
            `  avatar_url TEXT,\n` +
            `  business_id UUID,\n` +
            `  employee_code TEXT,\n` +
            `  phone TEXT,\n` +
            `  role TEXT,\n` +
            `  commission_percentage NUMERIC,\n` +
            `  is_active BOOLEAN,\n` +
            `  created_at TIMESTAMPTZ,\n` +
            `  updated_at TIMESTAMPTZ\n` +
            `)\n` +
            `LANGUAGE plpgsql\n` +
            `SECURITY DEFINER\n` +
            `AS $$\n` +
            `BEGIN\n` +
            `  RETURN QUERY\n` +
            `  SELECT u.*\n` +
            `  FROM users u\n` +
            `  WHERE u.business_id = p_business_id\n` +
            `  ORDER BY u.email;\n` +
            `END;\n` +
            `$$;\n\n` +
            `GRANT EXECUTE ON FUNCTION get_users_by_business_id(UUID) TO anon, authenticated;`
          )
        }
        throw new Error(`Error al obtener usuarios: ${allUsersError.message}. Verifica que el business_id "${cleanBusinessId}" sea correcto.`)
      }

      if (!allUsers || allUsers.length === 0) {
        // Verificar si el error fue silencioso (RLS bloqueando)
        const hasRlsError = activeError && (
          activeError.message.toLowerCase().includes('permission') ||
          activeError.message.toLowerCase().includes('rls') ||
          activeError.message.toLowerCase().includes('policy') ||
          activeError.code === '42501'
        )

        if (hasRlsError) {
          throw new Error(
            `🚫 ERROR: Las políticas RLS están bloqueando la consulta.\n\n` +
            `✅ SOLUCIÓN OBLIGATORIA:\n\n` +
            `1. Ve a: https://app.supabase.com → Tu Proyecto → SQL Editor\n` +
            `2. Abre el archivo: "EJECUTAR_AHORA.sql" en este proyecto\n` +
            `3. Copia TODO el contenido (desde CREATE hasta GRANT)\n` +
            `4. Pégalo en Supabase SQL Editor\n` +
            `5. Haz clic en "Run" o presiona Ctrl+Enter\n` +
            `6. Deberías ver: "Success. No rows returned"\n` +
            `7. Recarga esta página y prueba de nuevo\n\n` +
            `⚠️ Sin esta función, NO podrás ver los emails disponibles.`
          )
        }

        // Si no hay error de RLS pero tampoco hay usuarios, puede ser que RLS esté bloqueando silenciosamente
        throw new Error(
          `No se encontraron usuarios para el business_id: "${cleanBusinessId}".\n\n` +
          `🔍 Posibles causas:\n` +
          `1. El business_id no existe o es incorrecto\n` +
          `2. No hay usuarios en la tabla users con ese business_id\n` +
          `3. Las políticas RLS están bloqueando la consulta (más probable)\n\n` +
          `✅ SOLUCIÓN OBLIGATORIA:\n` +
          `1. Abre: https://app.supabase.com → Tu Proyecto → SQL Editor\n` +
          `2. Abre el archivo "EJECUTAR_EN_SUPABASE.sql" en este proyecto\n` +
          `3. Copia TODO el contenido y ejecútalo en Supabase\n` +
          `4. Deberías ver: "Success. No rows returned"\n` +
          `5. Recarga esta página y prueba de nuevo\n\n` +
          `⚠️ Sin esta función, NO podrás ver los emails disponibles.`
        )
      }

      // Si hay usuarios pero todos están inactivos, mostrar advertencia pero retornarlos
      const inactiveCount = allUsers.filter(u => !u.is_active).length
      if (inactiveCount > 0 && inactiveCount === allUsers.length) {
        console.warn(`Todos los usuarios del business_id ${cleanBusinessId} están inactivos`)
      }

      return allUsers as User[]
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !data) return null

      return data as User
    } catch (error) {
      return null
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async resetPassword(email: string): Promise<void> {
    await supabase.auth.resetPasswordForEmail(email)
  }

  async createUser(request: CreateUserRequest, businessId: string): Promise<User> {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request.email.trim(),
        password: request.password,
        email_confirm: true, // Confirmar email automáticamente
      })

      if (authError) {
        throw new Error(`Error al crear usuario en Auth: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario en Auth')
      }

      // 2. Crear registro en la tabla users
      const userData = {
        id: authData.user.id,
        email: request.email.trim(),
        name: request.name || null,
        phone: request.phone || null,
        employee_code: request.employee_code || null,
        role: request.role,
        commission_percentage: request.commission_percentage || null,
        is_active: request.is_active !== undefined ? request.is_active : true,
        business_id: businessId,
      }

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (userError) {
        // Si falla la inserción en users, intentar eliminar el usuario de Auth
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.error('Error al eliminar usuario de Auth después de fallo:', deleteError)
        }
        throw new Error(`Error al crear registro de usuario: ${userError.message}`)
      }

      return userRecord as User
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
}


