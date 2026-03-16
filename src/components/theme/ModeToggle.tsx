'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = (event: React.MouseEvent) => {
    // @ts-ignore
    const isAppearanceTransition = document.startViewTransition !== undefined &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!isAppearanceTransition) {
      setTheme(theme === 'light' ? 'dark' : 'light')
      return
    }

    const x = event.clientX
    const y = event.clientY
    
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )

    // @ts-ignore
    const transition = document.startViewTransition(async () => {
      setTheme(theme === 'light' ? 'dark' : 'light')
      // Pequeño micro-task para asegurar que el DOM se actualizó con las clases de tema
      await new Promise((resolve) => setTimeout(resolve, 1))
    })

    transition.ready.then(() => {
      // Animamos SOLAMENTE el nuevo tema expandiéndose sobre el viejo
      // Esto evita el "gap" o flash blanco entre animaciones secuenciales
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10 text-foreground/60" aria-hidden>
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all rounded-xl border border-border/20 group"
      onClick={toggleTheme}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:text-primary" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:text-primary" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
