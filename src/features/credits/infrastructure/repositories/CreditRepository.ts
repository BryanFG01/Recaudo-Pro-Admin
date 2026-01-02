import { ICreditRepository, CreditWithUserEmail } from '../../domain/port'
import { Credit, CreateCreditRequest, UpdateCreditRequest } from '../../domain/models'
import { CreditFilters } from '@/shared/types/filters'
import { supabase } from '@/shared/config/supabase'

export class CreditRepository implements ICreditRepository {
  async getCredits(): Promise<Credit[]> {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error al obtener créditos: ${error.message}`)
    return (data || []) as Credit[]
  }

  async getCreditsByClientId(clientId: string): Promise<Credit[]> {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error al obtener créditos del cliente: ${error.message}`)
    return (data || []) as Credit[]
  }

  async getCreditById(id: string): Promise<Credit | null> {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Credit
  }

  async createCredit(request: CreateCreditRequest, businessId: string): Promise<Credit> {
    const { data, error } = await supabase
      .from('credits')
      .insert({
        ...request,
        business_id: businessId,
        paid_installments: 0,
        overdue_installments: 0,
        total_balance: request.total_amount,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear crédito: ${error.message}`)
    return data as Credit
  }

  async updateCredit(request: UpdateCreditRequest, businessId: string): Promise<Credit> {
    const { id, ...updates } = request
    const { data, error } = await supabase
      .from('credits')
      .update(updates)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar crédito: ${error.message}`)
    return data as Credit
  }

  async getCreditsWithFilters(filters: CreditFilters): Promise<CreditWithUserEmail[]> {
    try {
      console.log('🔍 Buscando créditos con filtros:', filters)
      
      // Intentar usar función RPC primero para bypasear RLS
      try {
        const { data: rpcCredits, error: rpcError } = await supabase.rpc('get_credits_by_business_id', {
          p_business_id: filters.businessId,
        })

        if (!rpcError && rpcCredits && rpcCredits.length > 0) {
          console.log('✅ Créditos obtenidos via RPC:', rpcCredits.length)
          // Convertir a formato Credit
          const credits = (rpcCredits || []).map((c: any) => ({
            id: c.id,
            client_id: c.client_id,
            total_amount: Number(c.total_amount),
            installment_amount: Number(c.installment_amount),
            total_installments: c.total_installments,
            paid_installments: c.paid_installments,
            overdue_installments: c.overdue_installments,
            total_balance: Number(c.total_balance),
            last_payment_amount: c.last_payment_amount ? Number(c.last_payment_amount) : null,
            last_payment_date: c.last_payment_date,
            next_due_date: c.next_due_date,
            business_id: c.business_id,
            created_at: c.created_at,
            updated_at: c.updated_at,
          }))

          // Aplicar filtros adicionales si existen
          let filteredCredits: Credit[] = credits
          if (filters.clientId) {
            filteredCredits = filteredCredits.filter((c: Credit) => c.client_id === filters.clientId)
          }
          if (filters.startDate) {
            filteredCredits = filteredCredits.filter((c: Credit) => new Date(c.created_at) >= new Date(filters.startDate!))
          }
          if (filters.endDate) {
            filteredCredits = filteredCredits.filter((c: Credit) => new Date(c.created_at) <= new Date(filters.endDate!))
          }

          // Continuar con la lógica de obtener emails de usuarios
          if (filteredCredits.length === 0) return []
          
          // Obtener collections para emails y método de pago
          const creditIds = filteredCredits.map((c: Credit) => c.id)
          let collections: Array<{ credit_id: string; user_id: string; payment_method: string | null; payment_date: string }> = []
          
          try {
            // Intentar usar función RPC primero
            const { data: rpcCollections, error: rpcCollectionsError } = await supabase.rpc('get_collections_by_business_id', {
              p_business_id: filters.businessId,
            })

            if (!rpcCollectionsError && rpcCollections) {
              // Filtrar solo las collections de estos créditos
              collections = (rpcCollections || [])
                .filter((col: any) => creditIds.includes(col.credit_id))
                .map((col: any) => ({
                  credit_id: col.credit_id,
                  user_id: col.user_id,
                  payment_method: col.payment_method,
                  payment_date: col.payment_date,
                }))
              console.log('✅ Collections obtenidas via RPC:', collections.length)
            } else {
              // Fallback: consulta directa
              const { data: collectionsData, error: collectionsError } = await supabase
                .from('collections')
                .select('credit_id, user_id, payment_method, payment_date')
                .in('credit_id', creditIds)

              if (!collectionsError && collectionsData) {
                collections = collectionsData as Array<{ credit_id: string; user_id: string; payment_method: string | null; payment_date: string }>
              } else {
                console.warn('⚠️ Error al obtener collections:', collectionsError?.message)
              }
            }
          } catch (err) {
            console.error('Error al obtener collections:', err)
          }

          // Obtener usuarios usando RPC
          let users: Array<{ id: string; email: string }> = []
          try {
            const { data: rpcUsers, error: rpcUsersError } = await supabase.rpc('get_users_by_business_id', {
              p_business_id: filters.businessId,
            })
            if (!rpcUsersError && rpcUsers) {
              users = (rpcUsers || []).map((u: any) => ({ id: u.id, email: u.email }))
            }
          } catch (err) {
            console.error('Error al obtener usuarios:', err)
          }

          const userMap = new Map(users.map(u => [u.id, u.email]))

          // Determinar el usuario más activo y método de pago más reciente por crédito
          const creditsWithUserEmail: CreditWithUserEmail[] = filteredCredits.map((credit: Credit) => {
            const creditCollections = collections.filter((c: { credit_id: string; user_id: string; payment_method: string | null; payment_date: string }) => c.credit_id === credit.id)
            const userCounts = new Map<string, number>()
            
            creditCollections.forEach((c) => {
              const count = userCounts.get(c.user_id) || 0
              userCounts.set(c.user_id, count + 1)
            })

            let mostActiveUserId: string | null = null
            let maxCount = 0
            userCounts.forEach((count, userId) => {
              if (count > maxCount) {
                maxCount = count
                mostActiveUserId = userId
              }
            })

            const userEmail = mostActiveUserId ? userMap.get(mostActiveUserId) || null : null

            // Obtener el método de pago más reciente
            let latestPaymentMethod: string | null = null
            if (creditCollections.length > 0) {
              // Ordenar por fecha de pago descendente y tomar el más reciente
              const sortedCollections = [...creditCollections].sort((a, b) => 
                new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
              )
              latestPaymentMethod = sortedCollections[0]?.payment_method || null
            }

            return {
              ...credit,
              user_email: userEmail,
              payment_method: latestPaymentMethod,
            }
          })

          // Filtrar por email si se especifica
          if (filters.userEmail) {
            return creditsWithUserEmail.filter(c => c.user_email === filters.userEmail)
          }

          return creditsWithUserEmail
        } else {
          console.warn('⚠️ RPC no disponible o sin datos, usando consulta directa. Error:', rpcError)
        }
      } catch (rpcErr) {
        console.warn('⚠️ Error al usar RPC, usando consulta directa:', rpcErr)
      }
      
      // Fallback: consulta directa
      let creditsQuery = supabase
        .from('credits')
        .select('*')
        .eq('business_id', filters.businessId)

      // Filtrar por cliente
      if (filters.clientId) {
        creditsQuery = creditsQuery.eq('client_id', filters.clientId)
      }

      // Filtrar por fecha de creación
      if (filters.startDate) {
        creditsQuery = creditsQuery.gte('created_at', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        creditsQuery = creditsQuery.lte('created_at', new Date(filters.endDate).toISOString())
      }

      const { data: credits, error: creditsError } = await creditsQuery.order('created_at', { ascending: false })

      console.log('📊 Resultado de consulta créditos:', {
        encontrados: credits?.length || 0,
        error: creditsError?.message,
        businessId: filters.businessId,
        errorCode: creditsError?.code,
        errorDetails: creditsError?.details
      })
      
      // Si hay error de permisos (RLS), mostrar mensaje más claro
      if (creditsError && (creditsError.code === '42501' || creditsError.message?.includes('permission') || creditsError.message?.includes('RLS'))) {
        console.error('🚫 ERROR RLS: Las políticas están bloqueando la consulta.')
        console.error('✅ SOLUCIÓN: Ejecuta el archivo EJECUTAR_FUNCIONES_RPC.sql en Supabase SQL Editor')
        throw new Error(
          'Las políticas RLS están bloqueando la consulta de créditos.\n\n' +
          'SOLUCIÓN:\n' +
          '1. Abre Supabase Dashboard → SQL Editor\n' +
          '2. Abre el archivo "EJECUTAR_FUNCIONES_RPC.sql"\n' +
          '3. Copia y ejecuta TODO el contenido\n' +
          '4. Recarga esta página'
        )
      }

      if (creditsError) {
        console.error('❌ Error al obtener créditos:', creditsError)
        throw new Error(`Error al obtener créditos: ${creditsError.message}`)
      }
      
      if (!credits || credits.length === 0) {
        console.warn('⚠️ No se encontraron créditos para business_id:', filters.businessId)
        return []
      }

      // Si se filtra por email de usuario, necesitamos obtener los recaudos asociados
      if (filters.userEmail) {
        // Obtener el user_id del email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', filters.userEmail)
          .eq('business_id', filters.businessId)
          .single()

        if (userError || !userData) return []

        const userId = userData.id

        // Obtener collections para determinar qué créditos están asociados a este usuario
        const creditIds = credits.map(c => c.id)
        const { data: collections, error: collectionsError } = await supabase
          .from('collections')
          .select('credit_id')
          .in('credit_id', creditIds)
          .eq('user_id', userId)

        if (collectionsError) throw new Error(`Error al obtener recaudos: ${collectionsError.message}`)

        const creditIdsWithUser = new Set((collections || []).map((c: { credit_id: string }) => c.credit_id))
        const filteredCredits = credits.filter((c: Credit) => creditIdsWithUser.has(c.id))

        // Agregar email del usuario a cada crédito
        return filteredCredits.map((credit: Credit) => ({
          ...credit,
          user_email: filters.userEmail || null,
        })) as CreditWithUserEmail[]
      }

      // Obtener el email del usuario más activo para cada crédito
      const creditIds = credits.map((c: Credit) => c.id)
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('credit_id, user_id')
        .in('credit_id', creditIds)

      if (collectionsError) throw new Error(`Error al obtener recaudos: ${collectionsError.message}`)

      // Obtener todos los usuarios del business_id usando la función RPC
      let users: Array<{ id: string; email: string }> = []
      
      try {
        const { data: rpcUsers, error: rpcError } = await supabase.rpc('get_users_by_business_id', {
          p_business_id: filters.businessId,
        })

        if (!rpcError && rpcUsers && rpcUsers.length > 0) {
          users = (rpcUsers || []).map((u: any) => ({ id: u.id, email: u.email }))
          console.log('Usuarios obtenidos via RPC:', users.length)
        } else {
          console.warn('RPC falló o no retornó datos, usando fallback. Error:', rpcError)
          // Fallback: obtener solo los usuarios que tienen collections
          const userIds = [...new Set((collections || []).map(c => c.user_id).filter(Boolean))]
          if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id, email')
              .in('id', userIds)

            if (!usersError && usersData) {
              users = usersData || []
              console.log('Usuarios obtenidos via fallback:', users.length)
            } else {
              console.error('Error al obtener usuarios via fallback:', usersError)
            }
          } else {
            console.warn('No hay userIds en collections para obtener usuarios')
          }
        }
      } catch (err) {
        console.error('Error al obtener usuarios:', err)
        // Continuar con el proceso aunque falle la obtención de usuarios
      }

      const userMap = new Map(users.map(u => [u.id, u.email]))

      // Determinar el usuario más activo por crédito
      const creditsWithUserEmail: CreditWithUserEmail[] = credits.map((credit: Credit) => {
        const creditCollections = (collections || []).filter((c: { credit_id: string; user_id: string }) => c.credit_id === credit.id)
        const userCounts = new Map<string, number>()
        
        creditCollections.forEach((c: { credit_id: string; user_id: string }) => {
          const count = userCounts.get(c.user_id) || 0
          userCounts.set(c.user_id, count + 1)
        })

        let mostActiveUserId: string | null = null
        let maxCount = 0
        userCounts.forEach((count, userId) => {
          if (count > maxCount) {
            maxCount = count
            mostActiveUserId = userId
          }
        })

        const userEmail = mostActiveUserId ? userMap.get(mostActiveUserId) || null : null

        return {
          ...credit,
          user_email: userEmail,
        }
      })

      return creditsWithUserEmail
    } catch (error) {
      throw new Error(`Error al obtener créditos con filtros: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
}


