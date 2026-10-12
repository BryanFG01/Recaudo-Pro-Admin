import { useCallback, useEffect, useRef, useState } from 'react'
import { AppNotification } from '../../domain/models/Notification'
import { countUnseen, mergeNewest, seenKey, topicsOf, RefreshTopic } from '../../domain/services/notificationRules'
import { fetchNotifications } from '../../infrastructure/NotificationRepository'

/** Cada cuánto se consultan avisos nuevos (solo con la pestaña visible). */
export const POLL_INTERVAL_MS = 10_000
/** Cuánto dura un aviso emergente en pantalla. */
const TOAST_MS = 7_000

export const NOTIFICATIONS_EVENT = 'recaudo:notifications'

function readSeen(businessId: string): number {
  try {
    return Number(localStorage.getItem(seenKey(businessId)) ?? 0)
  } catch {
    return 0 // sin almacenamiento (modo privado): todo cuenta como no visto
  }
}

function writeSeen(businessId: string, id: number) {
  try {
    localStorage.setItem(seenKey(businessId), String(id))
  } catch {
    // sin almacenamiento: el contador se reinicia al recargar
  }
}

/**
 * Avisos del panel sin recargar la página: consulta cada 10 s, muestra los nuevos como avisos
 * emergentes y avisa a las pantallas abiertas (evento NOTIFICATIONS_EVENT) para que se refresquen.
 */
export function useNotificationFeed(businessId: string) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [toasts, setToasts] = useState<AppNotification[]>([])
  const [seenId, setSeenId] = useState(0)
  const cursor = useRef<number | null>(null)

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((n) => n.id !== id)), [])

  const announce = useCallback((incoming: AppNotification[]) => {
    if (incoming.length === 0) return
    setItems((current) => mergeNewest(current, incoming))
    setToasts((t) => [...t, ...incoming].slice(-3))
    for (const n of incoming) setTimeout(() => dismissToast(n.id), TOAST_MS)
    const topics = new Set<RefreshTopic>(incoming.flatMap(topicsOf))
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT, { detail: [...topics] }))
  }, [dismissToast])

  const poll = useCallback(async () => {
    try {
      if (cursor.current === null) {
        // Primera carga: historial reciente en la campana, sin avisos emergentes
        const page = await fetchNotifications()
        cursor.current = page.last_id
        setItems(mergeNewest([], page.items))
        return
      }
      const page = await fetchNotifications(cursor.current)
      cursor.current = page.last_id
      announce(page.items)
    } catch {
      // Sin conexión o sesión renovándose: se reintenta en la siguiente vuelta
    }
  }, [announce])

  useEffect(() => {
    if (!businessId) return
    setSeenId(readSeen(businessId))
    cursor.current = null
    void poll()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void poll()
    }, POLL_INTERVAL_MS)
    const onVisible = () => document.visibilityState === 'visible' && void poll()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [businessId, poll])

  const markAllSeen = useCallback(() => {
    const latest = items[0]?.id ?? 0
    if (latest <= seenId) return
    setSeenId(latest)
    writeSeen(businessId, latest)
  }, [items, seenId, businessId])

  return { items, toasts, unseen: countUnseen(items, seenId), seenId, markAllSeen, dismissToast }
}
