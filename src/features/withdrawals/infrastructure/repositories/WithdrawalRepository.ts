import { apiClient } from '@/shared/config/api'
import { Withdrawal, UpdateWithdrawalApprovalRequest } from '../../domain/models'
import { IWithdrawalRepository } from '../../domain/port'

/** Asegura que un ítem tenga la forma esperada (snake_case). */
function toWithdrawal(item: unknown): Withdrawal | null {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : ''
  if (!id) return null
  return {
    id,
    cash_session_id: typeof o.cash_session_id === 'string' ? o.cash_session_id : (o.cashSessionId as string) ?? '',
    user_id: typeof o.user_id === 'string' ? o.user_id : (o.userId as string) ?? '',
    amount: typeof o.amount === 'number' ? o.amount : Number(o.amount) || 0,
    reason: typeof o.reason === 'string' ? o.reason : o.reason == null ? null : String(o.reason),
    is_approved: o.is_approved === true || o.isApproved === true,
    created_at: typeof o.created_at === 'string' ? o.created_at : (o.createdAt as string) ?? undefined,
    updated_at: typeof o.updated_at === 'string' ? o.updated_at : (o.updatedAt as string) ?? undefined
  }
}

function normalizeWithdrawalsList(raw: unknown): Withdrawal[] {
  let arr: unknown[] = []
  if (Array.isArray(raw)) {
    arr = raw
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) arr = obj.data
    else if (Array.isArray(obj.withdrawals)) arr = obj.withdrawals
    else if (Array.isArray(obj.items)) arr = obj.items
    else if (Array.isArray(obj.results)) arr = obj.results
  }
  const out: Withdrawal[] = []
  for (const item of arr) {
    const w = toWithdrawal(item)
    if (w) out.push(w)
  }
  return out
}

export class WithdrawalRepository implements IWithdrawalRepository {
  /** GET /api/withdrawals/user/{userId} — devuelve data (lista de retiros del usuario). Errores se propagan. */
  async getByUserId(userId: string): Promise<Withdrawal[]> {
    const raw = await apiClient.get<Withdrawal[] | { data: Withdrawal[] }>(
      `/api/withdrawals/user/${encodeURIComponent(userId)}`
    )
    return normalizeWithdrawalsList(raw)
  }

  async getAll(): Promise<Withdrawal[]> {
    try {
      const raw = await apiClient.get<Withdrawal[] | { data: Withdrawal[] }>('/api/withdrawals')
      return normalizeWithdrawalsList(raw)
    } catch {
      return []
    }
  }

  /** GET /api/withdrawals?business_id=xxx — retiros del negocio. Evita mostrar datos de otro business. */
  async getAllByBusinessId(businessId: string): Promise<Withdrawal[]> {
    if (!businessId) return []
    try {
      const params = new URLSearchParams({ business_id: businessId })
      const raw = await apiClient.get<Withdrawal[] | { data: Withdrawal[] }>(
        `/api/withdrawals?${params.toString()}`
      )
      return normalizeWithdrawalsList(raw)
    } catch {
      return []
    }
  }

  /**
   * PATCH /api/withdrawals/{id} — aprueba o rechaza un retiro.
   * Body: { is_approved }.
   * is_approved: true = aprobar, is_approved: false = rechazar.
   */
  async updateApproval(
    id: string,
    request: UpdateWithdrawalApprovalRequest
  ): Promise<Withdrawal> {
    return apiClient.patch<Withdrawal>(
      `/api/withdrawals/${encodeURIComponent(id)}`,
      { is_approved: request.is_approved }
    )
  }
}
