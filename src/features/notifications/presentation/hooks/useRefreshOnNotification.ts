import { useEffect, useRef } from 'react'
import { RefreshTopic } from '../../domain/services/notificationRules'
import { NOTIFICATIONS_EVENT } from './useNotificationFeed'

/**
 * Vuelve a cargar los datos de una pantalla cuando llega un aviso que la afecta (ej. Retiros al
 * registrarse un gasto), sin que el administrador tenga que recargar la página.
 */
export function useRefreshOnNotification(topic: RefreshTopic, reload: () => void) {
  const latestReload = useRef(reload)
  latestReload.current = reload

  useEffect(() => {
    const onNotification = (event: Event) => {
      const topics = (event as CustomEvent<RefreshTopic[]>).detail ?? []
      if (topics.includes(topic)) latestReload.current()
    }
    window.addEventListener(NOTIFICATIONS_EVENT, onNotification)
    return () => window.removeEventListener(NOTIFICATIONS_EVENT, onNotification)
  }, [topic])
}
