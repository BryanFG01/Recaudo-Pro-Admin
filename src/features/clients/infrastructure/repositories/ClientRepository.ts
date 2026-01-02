import { IClientRepository } from '../../domain/port'
import { Client, CreateClientRequest, UpdateClientRequest } from '../../domain/models'
import { ClientWithCredits } from '../../domain/models/ClientWithCredits'
import { ClientFilters } from '@/shared/types/filters'
import { supabase } from '@/shared/config/supabase'

export class ClientRepository implements IClientRepository {
  async getClientsWithCredits(businessId: string, userEmail?: string): Promise<ClientWithCredits[]> {
    try {
      // Primero obtener todos los clientes del business_id
      let clientsQuery = supabase
        .from('clients')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      const { data: clients, error: clientsError } = await clientsQuery

      if (clientsError) throw new Error(`Error al obtener clientes: ${clientsError.message}`)
      if (!clients || clients.length === 0) return []

      // Obtener todos los créditos de estos clientes
      const clientIds = clients.map(c => c.id)
      const { data: credits, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .in('client_id', clientIds)

      if (creditsError) throw new Error(`Error al obtener créditos: ${creditsError.message}`)

      // Obtener collections para determinar qué usuario gestiona cada cliente
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('user_id, client_id')
        .in('client_id', clientIds)

      if (collectionsError) throw new Error(`Error al obtener recaudos: ${collectionsError.message}`)

      // Obtener usuarios usando la función RPC primero
      let users: Array<{ id: string; email: string }> = []
      
      try {
        const { data: rpcUsers, error: rpcError } = await supabase.rpc('get_users_by_business_id', {
          p_business_id: businessId,
        })

        if (!rpcError && rpcUsers) {
          users = (rpcUsers || []).map((u: any) => ({ id: u.id, email: u.email }))
        } else {
          // Fallback: obtener solo los usuarios que tienen collections
          const userIds = [...new Set((collections || []).map(c => c.user_id).filter(Boolean))]
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

      const userMap = new Map((users || []).map(u => [u.id, u.email]))

      // Agregar información de créditos a cada cliente
      const clientsWithCredits: ClientWithCredits[] = clients.map(client => {
        const clientCredits = (credits || []).filter(c => c.client_id === client.id)
        const clientCollections = (collections || []).filter(c => c.client_id === client.id)

        // Determinar el usuario que más ha gestionado este cliente
        const userCounts = new Map<string, number>()
        clientCollections.forEach(c => {
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

        const totalCredits = clientCredits.length
        const totalAmount = clientCredits.reduce((sum, c) => sum + (c.total_amount || 0), 0)
        const totalBalance = clientCredits.reduce((sum, c) => sum + (c.total_balance || 0), 0)

        return {
          ...client,
          total_credits: totalCredits,
          total_amount: totalAmount,
          total_balance: totalBalance,
          user_email: userEmail,
        }
      }).filter((c): c is ClientWithCredits => c !== null)

      // Filtrar por email del usuario si se proporciona
      if (userEmail) {
        return clientsWithCredits.filter(c => c.user_email === userEmail)
      }

      return clientsWithCredits
    } catch (error) {
      throw new Error(`Error al obtener clientes con créditos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error al obtener clientes: ${error.message}`)
    return (data || []) as Client[]
  }

  async getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Client
  }

  async searchClients(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,document_id.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error al buscar clientes: ${error.message}`)
    return (data || []) as Client[]
  }

  async createClient(request: CreateClientRequest, businessId: string): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...request,
        business_id: businessId,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear cliente: ${error.message}`)
    return data as Client
  }

  async updateClient(request: UpdateClientRequest): Promise<Client> {
    const { id, ...updates } = request
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar cliente: ${error.message}`)
    return data as Client
  }

  async getClientsWithFilters(filters: ClientFilters): Promise<ClientWithCredits[]> {
    try {
      console.log('🔍 Buscando clientes con filtros:', filters)
      
      // Intentar usar función RPC primero para bypasear RLS
      try {
        const { data: rpcClients, error: rpcError } = await supabase.rpc('get_clients_by_business_id', {
          p_business_id: filters.businessId,
        })

        if (!rpcError && rpcClients && rpcClients.length > 0) {
          console.log('✅ Clientes obtenidos via RPC:', rpcClients.length)
          
          let filteredClients = rpcClients as any[]
          
          // Aplicar filtros adicionales
          if (filters.clientId) {
            filteredClients = filteredClients.filter(c => c.id === filters.clientId)
          }
          if (filters.startDate) {
            filteredClients = filteredClients.filter(c => new Date(c.created_at) >= new Date(filters.startDate!))
          }
          if (filters.endDate) {
            filteredClients = filteredClients.filter(c => new Date(c.created_at) <= new Date(filters.endDate!))
          }

          // Obtener créditos y collections para calcular estadísticas
          const clientIds = filteredClients.map(c => c.id)
          
          // Usar función RPC para créditos si está disponible
          let credits: any[] = []
          try {
            const { data: rpcCredits, error: rpcCreditsError } = await supabase.rpc('get_credits_by_business_id', {
              p_business_id: filters.businessId,
            })
            if (!rpcCreditsError && rpcCredits) {
              credits = (rpcCredits || []).filter((c: any) => clientIds.includes(c.client_id))
            }
          } catch (err) {
            console.error('Error al obtener créditos via RPC:', err)
            // Fallback: consulta directa
            const { data: creditsData, error: creditsError } = await supabase
              .from('credits')
              .select('*')
              .in('client_id', clientIds)
            if (!creditsError && creditsData) {
              credits = creditsData
            }
          }

          // Obtener collections usando RPC
          let collections: Array<{ user_id: string; client_id: string }> = []
          try {
            const { data: rpcCollections, error: rpcCollectionsError } = await supabase.rpc('get_collections_by_business_id', {
              p_business_id: filters.businessId,
            })
            if (!rpcCollectionsError && rpcCollections) {
              collections = (rpcCollections || [])
                .filter((col: any) => clientIds.includes(col.client_id))
                .map((col: any) => ({
                  user_id: col.user_id,
                  client_id: col.client_id,
                }))
            }
          } catch (err) {
            console.error('Error al obtener collections via RPC:', err)
            // Fallback: consulta directa
            const { data: collectionsData, error: collectionsError } = await supabase
              .from('collections')
              .select('user_id, client_id')
              .in('client_id', clientIds)
            if (!collectionsError && collectionsData) {
              collections = collectionsData as Array<{ user_id: string; client_id: string }>
            }
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

          // Agregar información de créditos y email del usuario más activo
          const clientsWithCredits: ClientWithCredits[] = filteredClients.map(client => {
            const clientCredits = credits.filter(c => c.client_id === client.id)
            const clientCollections = collections.filter(c => c.client_id === client.id)

            // Determinar el usuario que más ha gestionado este cliente
            const userCounts = new Map<string, number>()
            clientCollections.forEach(c => {
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

            const totalCredits = clientCredits.length
            const totalAmount = clientCredits.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0)
            const totalBalance = clientCredits.reduce((sum, c) => sum + (Number(c.total_balance) || 0), 0)

            return {
              ...client,
              total_credits: totalCredits,
              total_amount: totalAmount,
              total_balance: totalBalance,
              user_email: userEmail,
            }
          })

          // Filtrar por email del usuario si se proporciona
          if (filters.userEmail) {
            return clientsWithCredits.filter(c => c.user_email === filters.userEmail)
          }

          return clientsWithCredits
        } else {
          console.warn('⚠️ RPC no disponible o sin datos, usando consulta directa. Error:', rpcError)
        }
      } catch (rpcErr) {
        console.warn('⚠️ Error al usar RPC, usando consulta directa:', rpcErr)
      }
      
      // Fallback: consulta directa
      let clientsQuery = supabase
        .from('clients')
        .select('*')
        .eq('business_id', filters.businessId)

      // Filtrar por cliente específico
      if (filters.clientId) {
        clientsQuery = clientsQuery.eq('id', filters.clientId)
      }

      // Filtrar por fecha de creación
      if (filters.startDate) {
        clientsQuery = clientsQuery.gte('created_at', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        clientsQuery = clientsQuery.lte('created_at', new Date(filters.endDate).toISOString())
      }

      const { data: clients, error: clientsError } = await clientsQuery.order('created_at', { ascending: false })

      if (clientsError) throw new Error(`Error al obtener clientes: ${clientsError.message}`)
      if (!clients || clients.length === 0) return []

      // Obtener créditos y collections para calcular estadísticas
      const clientIds = clients.map(c => c.id)
      const { data: credits, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .in('client_id', clientIds)

      if (creditsError) throw new Error(`Error al obtener créditos: ${creditsError.message}`)

      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('user_id, client_id')
        .in('client_id', clientIds)

      if (collectionsError) throw new Error(`Error al obtener recaudos: ${collectionsError.message}`)

      // Obtener usuarios usando la función RPC primero
      let users: Array<{ id: string; email: string }> = []
      
      try {
        const { data: rpcUsers, error: rpcError } = await supabase.rpc('get_users_by_business_id', {
          p_business_id: filters.businessId,
        })

        if (!rpcError && rpcUsers) {
          users = (rpcUsers || []).map((u: any) => ({ id: u.id, email: u.email }))
        } else {
          // Fallback: obtener solo los usuarios que tienen collections
          const userIds = [...new Set((collections || []).map(c => c.user_id).filter(Boolean))]
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

      const userMap = new Map(users.map(u => [u.id, u.email]))

      // Agregar información de créditos y email del usuario más activo
      const clientsWithCredits: ClientWithCredits[] = clients.map(client => {
        const clientCredits = (credits || []).filter(c => c.client_id === client.id)
        const clientCollections = (collections || []).filter(c => c.client_id === client.id)

        // Determinar el usuario que más ha gestionado este cliente
        const userCounts = new Map<string, number>()
        clientCollections.forEach(c => {
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

        const totalCredits = clientCredits.length
        const totalAmount = clientCredits.reduce((sum, c) => sum + (c.total_amount || 0), 0)
        const totalBalance = clientCredits.reduce((sum, c) => sum + (c.total_balance || 0), 0)

        return {
          ...client,
          total_credits: totalCredits,
          total_amount: totalAmount,
          total_balance: totalBalance,
          user_email: userEmail,
        }
      })

      // Filtrar por email del usuario si se proporciona
      if (filters.userEmail) {
        return clientsWithCredits.filter(c => c.user_email === filters.userEmail)
      }

      return clientsWithCredits
    } catch (error) {
      throw new Error(`Error al obtener clientes con filtros: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
}


