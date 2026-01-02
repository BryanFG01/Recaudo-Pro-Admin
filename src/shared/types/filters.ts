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
  clientId?: string
  userEmail?: string
  payment_method?: string
}

export interface ClientFilters extends DateFilter {
  businessId: string
  userEmail?: string
  clientId?: string
}

