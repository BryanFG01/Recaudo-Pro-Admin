export interface DateFilter {
  startDate?: Date | string
  endDate?: Date | string
}

export interface CreditFilters extends DateFilter {
  businessId: string
  clientId?: string
  userEmail?: string
}

export interface CollectionFilters extends DateFilter {
  businessId: string
  /** Filtro por usuario: GET /api/collections?business_id=&user_id= */
  userId?: string
  clientId?: string
  userEmail?: string
  payment_method?: string
}

export interface ClientFilters extends DateFilter {
  businessId: string
  /** Filtro opcional por usuario responsable. El negocio sale de la sesión. */
  userId?: string
  /** Código del negocio (ej. ARG01). Alternativa a businessId; el backend prioriza business_code. */
  businessCode?: string
  /** Número del usuario (ej. ARGCOBRADOR1). Alternativa a userId; el backend prioriza user_number. */
  userNumber?: string
  userEmail?: string
  clientId?: string
}

