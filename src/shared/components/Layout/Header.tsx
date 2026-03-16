import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import Link from "next/link"
import { ModeToggle } from "@/components/theme/ModeToggle"

export default function Header() {
  const pathname = usePathname()
  const pathnames = pathname ? pathname.split("/").filter((x) => x) : []

  const routeMap: Record<string, string> = {
    admin: "Administración",
    users: "Equipo",
    clients: "Clientes",
    map: "Mapa",
    credits: "Préstamos",
    collections: "Recaudos",
    "cash-sessions": "Caja",
    flow: "Flujo",
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/40 px-6 bg-background/60 backdrop-blur-md sticky top-0 z-20 transition-all duration-300">
      <div className="flex items-center gap-4 w-full justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-foreground/80 hover:text-foreground transition-all flex items-center justify-center rounded-lg hover:bg-accent/50 border border-border/20" />
          <Separator orientation="vertical" className="h-4 opacity-20" />
          <nav className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
            <Link href="/admin" className="flex items-center hover:text-primary transition-colors">
              <Home className="h-3.5 w-3.5" />
            </Link>
            <ChevronRight className="h-3 w-3 opacity-20" />
            {pathnames.length === 0 ? (
              <span className="text-foreground font-black tracking-widest">Dashboard</span>
            ) : (
              pathnames.map((name, index) => {
                const isLast = index === pathnames.length - 1
                const displayName = routeMap[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1)
                return (
                  <div key={name} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-3 w-3 opacity-20 mx-1" />
                    )}
                    <span
                      className={cn(
                        "transition-colors",
                        isLast ? "text-foreground font-black tracking-widest" : "hover:text-primary cursor-pointer"
                      )}
                    >
                      {displayName}
                    </span>
                  </div>
                )
              })
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
