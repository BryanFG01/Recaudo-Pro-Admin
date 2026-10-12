import {
  CashSession,
  CashSessionEvent,
  CashSessionFlow,
  CreateCashSessionRequest,
  DailySummaryResponse,
  UpdateCashSessionRequest
} from '../models'

export interface ICashSessionRepository {
  create(request: CreateCashSessionRequest): Promise<CashSession>
  update(id: string, request: UpdateCashSessionRequest): Promise<CashSession>
  getById(id: string): Promise<CashSession | null>
  getByBusinessId(businessId: string): Promise<CashSession[]>
  getByUserId(userId: string): Promise<CashSession[]>
  getFlow(id: string): Promise<CashSessionFlow | null>
  getDailySummaryByUser(userId: string): Promise<DailySummaryResponse | null>
  delete(id: string): Promise<void>
  /** Abre (o reabre si es de hoy) la caja del cobrador. */
  open(userId: string): Promise<CashSession>
  /** Cierra la caja: la caja actual queda como caja final. */
  close(id: string): Promise<CashSession>
  getEvents(id: string): Promise<CashSessionEvent[]>
  /** Recarga a una caja abierta: el monto se suma a la caja inicial. */
  topUp(id: string, amount: number): Promise<CashSession>
}
