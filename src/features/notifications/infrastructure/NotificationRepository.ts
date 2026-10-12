import { apiClient } from '@/shared/config/api'
import { NotificationsPage } from '../domain/models/Notification'

/** GET /api/notifications — sin cursor: los últimos avisos; con cursor: solo los nuevos. */
export async function fetchNotifications(after?: number): Promise<NotificationsPage> {
  const query = after != null ? `?after=${after}` : ''
  const page = await apiClient.get<NotificationsPage>(`/api/notifications${query}`)
  return { items: Array.isArray(page?.items) ? page.items : [], last_id: Number(page?.last_id ?? after ?? 0) }
}
