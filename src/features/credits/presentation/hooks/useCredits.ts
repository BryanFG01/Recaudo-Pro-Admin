import { useMemo } from 'react'
import useSWR from 'swr'
import { CreditService } from '../../domain/services/CreditService'
import { CreditRepository } from '../../infrastructure/repositories/CreditRepository'
import {
  buildGetCreditsUseCase,
  buildGetCreditsByClientIdUseCase,
  buildGetCreditByIdUseCase,
  buildCreateCreditUseCase,
  buildUpdateCreditUseCase,
} from '../../application/useCases'
import { CreateCreditRequest, UpdateCreditRequest } from '../../domain/models'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'

export const useCredits = () => {
  const { user } = useAuthStore()

  const creditService = useMemo(() => {
    const repository = new CreditRepository()
    return new CreditService(repository)
  }, [])

  const getCreditsUseCase = useMemo(
    () => buildGetCreditsUseCase(creditService),
    [creditService]
  )

  const getCreditsByClientIdUseCase = useMemo(
    () => buildGetCreditsByClientIdUseCase(creditService),
    [creditService]
  )

  const getCreditByIdUseCase = useMemo(
    () => buildGetCreditByIdUseCase(creditService),
    [creditService]
  )

  const createCreditUseCase = useMemo(
    () => buildCreateCreditUseCase(creditService),
    [creditService]
  )

  const updateCreditUseCase = useMemo(
    () => buildUpdateCreditUseCase(creditService),
    [creditService]
  )

  const { data, error, isLoading, mutate } = useSWR(
    user ? 'credits' : null,
    () => getCreditsUseCase()
  )

  const createCredit = async (request: CreateCreditRequest) => {
    if (!user?.business_id) {
      throw new Error('Usuario no tiene negocio asignado')
    }
    const result = await createCreditUseCase(request, user.business_id)
    mutate()
    return result
  }

  const updateCredit = async (request: UpdateCreditRequest) => {
    if (!user?.business_id) {
      throw new Error('Usuario no tiene negocio asignado')
    }
    const result = await updateCreditUseCase(request, user.business_id)
    mutate()
    return result
  }

  return {
    credits: data || [],
    error,
    isLoading,
    refetch: mutate,
    createCredit,
    updateCredit,
    getCreditsByClientId: getCreditsByClientIdUseCase,
    getCreditById: getCreditByIdUseCase,
  }
}


