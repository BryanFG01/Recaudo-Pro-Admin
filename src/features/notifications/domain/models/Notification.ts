/** Aviso del panel (GET /api/notifications). */
export interface AppNotification {
  /** Creciente: cursor para pedir solo lo nuevo. */
  id: number
  type: string
  title: string
  body: string
  entity_id: string | null
  created_at: string
}

export interface NotificationsPage {
  items: AppNotification[]
  last_id: number
}
