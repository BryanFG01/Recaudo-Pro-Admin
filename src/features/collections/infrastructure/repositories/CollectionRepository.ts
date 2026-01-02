import { supabase } from '@/shared/config/supabase'
import { CollectionFilters } from '@/shared/types/filters'
import { Collection, CreateCollectionRequest } from '../../domain/models'
import { CollectionWithUserEmail, ICollectionRepository } from '../../domain/port'

export class CollectionRepository implements ICollectionRepository {
  async getCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('payment_date', { ascending: false })

    if (error) throw new Error(`Error al obtener recaudos: ${error.message}`)
    return (data || []) as Collection[]
  }

  async getRecentCollections(limit: number = 10): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('payment_date', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Error al obtener recaudos recientes: ${error.message}`)
    return (data || []) as Collection[]
  }

  async getCollectionsByClientId(clientId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('client_id', clientId)
      .order('payment_date', { ascending: false })

    if (error) throw new Error(`Error al obtener recaudos del cliente: ${error.message}`)
    return (data || []) as Collection[]
  }

  async getCollectionsByCreditId(creditId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('credit_id', creditId)
      .order('payment_date', { ascending: false })

    if (error) throw new Error(`Error al obtener recaudos del crédito: ${error.message}`)
    return (data || []) as Collection[]
  }

  async createCollection(
    request: CreateCollectionRequest,
    businessId: string,
    userId: string
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        ...request,
        business_id: businessId,
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      // Fallback si las columnas de payment_method no existen
      if (error.message.includes('payment_method') || error.message.includes('PGRST204')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('collections')
          .insert({
            credit_id: request.credit_id,
            client_id: request.client_id,
            amount: request.amount,
            payment_date: request.payment_date,
            notes: request.notes,
            business_id: businessId,
            user_id: userId
          })
          .select()
          .single()

        if (fallbackError) {
          throw new Error(`Error al crear recaudo: ${fallbackError.message}`)
        }
        return fallbackData as Collection
      }
      throw new Error(`Error al crear recaudo: ${error.message}`)
    }

    return data as Collection
  }

  async getCollectionsWithFilters(filters: CollectionFilters): Promise<CollectionWithUserEmail[]> {
    try {
      console.log('🔍 Buscando recaudos con filtros:', filters)

      // Intentar usar función RPC primero para bypasear RLS
      try {
        const { data: rpcCollections, error: rpcError } = await supabase.rpc(
          'get_collections_by_business_id',
          {
            p_business_id: filters.businessId
          }
        )

        if (!rpcError && rpcCollections && rpcCollections.length > 0) {
          console.log('✅ Recaudos obtenidos via RPC:', rpcCollections.length)

          let filteredCollections = rpcCollections as any[]

          // Aplicar filtros adicionales
          if (filters.clientId) {
            filteredCollections = filteredCollections.filter(
              (c) => c.client_id === filters.clientId
            )
          }
          if (filters.startDate) {
            filteredCollections = filteredCollections.filter(
              (c) => new Date(c.payment_date) >= new Date(filters.startDate!)
            )
          }
          if (filters.endDate) {
            filteredCollections = filteredCollections.filter(
              (c) => new Date(c.payment_date) <= new Date(filters.endDate!)
            )
          }
          if (filters.payment_method) {
            // Mapear valores del filtro a valores de la base de datos
            const paymentMethodMap: Record<string, string> = {
              cash: 'efectivo',
              transfer: 'Transacción'
            }
            const dbValue = paymentMethodMap[filters.payment_method] || filters.payment_method
            filteredCollections = filteredCollections.filter(
              (c) => c.payment_method && c.payment_method.toLowerCase() === dbValue.toLowerCase()
            )
          }
          if (filters.userEmail) {
            // Obtener user_id del email usando RPC
            const { data: rpcUsers, error: rpcUsersError } = await supabase.rpc(
              'get_users_by_business_id',
              {
                p_business_id: filters.businessId
              }
            )
            if (!rpcUsersError && rpcUsers) {
              const user = (rpcUsers || []).find((u: any) => u.email === filters.userEmail)
              if (user) {
                filteredCollections = filteredCollections.filter((c) => c.user_id === user.id)
              } else {
                return []
              }
            }
          }

          // Obtener emails de usuarios
          let users: Array<{ id: string; email: string }> = []

          try {
            const { data: rpcUsers, error: rpcUsersError } = await supabase.rpc(
              'get_users_by_business_id',
              {
                p_business_id: filters.businessId
              }
            )
            if (!rpcUsersError && rpcUsers) {
              users = (rpcUsers || []).map((u: any) => ({ id: u.id, email: u.email }))
            }
          } catch (err) {
            console.error('Error al obtener usuarios:', err)
          }

          const userMap = new Map(users.map((u) => [u.id, u.email]))

          return filteredCollections.map((collection) => ({
            ...collection,
            user_email: userMap.get(collection.user_id) || null
          })) as CollectionWithUserEmail[]
        } else {
          console.warn(
            '⚠️ RPC no disponible o sin datos, usando consulta directa. Error:',
            rpcError
          )
        }
      } catch (rpcErr) {
        console.warn('⚠️ Error al usar RPC, usando consulta directa:', rpcErr)
      }

      // Fallback: consulta directa
      let collectionsQuery = supabase
        .from('collections')
        .select('*')
        .eq('business_id', filters.businessId)

      // Filtrar por cliente
      if (filters.clientId) {
        collectionsQuery = collectionsQuery.eq('client_id', filters.clientId)
      }

      // Filtrar por fecha de pago
      if (filters.startDate) {
        collectionsQuery = collectionsQuery.gte(
          'payment_date',
          new Date(filters.startDate).toISOString()
        )
      }
      if (filters.endDate) {
        collectionsQuery = collectionsQuery.lte(
          'payment_date',
          new Date(filters.endDate).toISOString()
        )
      }

      // Filtrar por método de pago
      if (filters.payment_method) {
        // Mapear valores del filtro a valores de la base de datos
        const paymentMethodMap: Record<string, string> = {
          cash: 'efectivo',
          transfer: 'transferencia'
        }
        const dbValue = paymentMethodMap[filters.payment_method] || filters.payment_method
        collectionsQuery = collectionsQuery.eq('payment_method', dbValue)
      }

      // Filtrar por email de usuario
      if (filters.userEmail) {
        // Obtener el user_id del email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', filters.userEmail)
          .eq('business_id', filters.businessId)
          .single()

        if (userError || !userData) return []

        collectionsQuery = collectionsQuery.eq('user_id', userData.id)
      }

      const { data: collections, error: collectionsError } = await collectionsQuery.order(
        'payment_date',
        { ascending: false }
      )

      if (collectionsError)
        throw new Error(`Error al obtener recaudos: ${collectionsError.message}`)
      if (!collections || collections.length === 0) return []

      // Obtener emails de usuarios usando la función RPC primero
      let users: Array<{ id: string; email: string }> = []

      try {
        const { data: rpcUsers, error: rpcError } = await supabase.rpc('get_users_by_business_id', {
          p_business_id: filters.businessId
        })

        if (!rpcError && rpcUsers) {
          users = (rpcUsers || []).map((u: any) => ({ id: u.id, email: u.email }))
        } else {
          // Fallback: obtener solo los usuarios que tienen collections
          const userIds = [...new Set(collections.map((c) => c.user_id).filter(Boolean))]
          if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id, email')
              .in('id', userIds)

            if (!usersError && usersData) {
              users = usersData || []
            }
          }
        }
      } catch (err) {
        console.error('Error al obtener usuarios:', err)
        // Continuar con el proceso aunque falle la obtención de usuarios
      }

      const userMap = new Map(users.map((u) => [u.id, u.email]))

      // Agregar email del usuario a cada recaudo
      return collections.map((collection) => ({
        ...collection,
        user_email: userMap.get(collection.user_id) || null
      })) as CollectionWithUserEmail[]
    } catch (error) {
      throw new Error(
        `Error al obtener recaudos con filtros: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      )
    }
  }
}
