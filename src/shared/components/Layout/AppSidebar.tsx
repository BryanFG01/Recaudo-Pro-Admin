import {
  Banknote,
  ChevronRight,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Navigation,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/features/auth/presentation/store/authStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const data = {
  navMain: [
    {
      title: "General",
      url: "/admin",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Gestión",
      url: "#",
      items: [
        {
          title: "Clientes",
          url: "/admin/clients",
          icon: Users,
        },
        {
          title: "Préstamos",
          url: "/admin/credits",
          icon: CreditCard,
        },
        {
          title: "Recaudos",
          url: "/admin/collections",
          icon: Banknote,
        },
        {
          title: "Mapa",
          url: "/admin/map",
          icon: Navigation,
        },
      ],
    },
    {
      title: "Finanzas",
      url: "#",
      items: [
        {
          title: "Caja",
          url: "/admin/cash-sessions",
          icon: Wallet,
        },
        {
          title: "Flujo",
          url: "/admin/flow",
          icon: TrendingUp,
        },
      ],
    },
    {
      title: "Configuración",
      url: "#",
      items: [
        {
          title: "Equipo",
          url: "/admin/users",
          icon: UserCog,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { signOut, user } = useAuthStore()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false)

  const handleLogout = () => {
    signOut()
    setIsLogoutDialogOpen(false)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 rounded-r-3xl" {...props}>
      <SidebarHeader className="h-16 border-b border-border/50 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <DollarSign className="size-5 text-primary-foreground" />
          </div>
          <span className="font-black text-sidebar-foreground tracking-tighter uppercase text-lg group-data-[collapsible=icon]:hidden">
            Recaudo<span className="text-primary font-black">Pro</span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 py-4 group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="h-10 px-4"
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className={pathname === item.url ? "text-primary" : "text-muted-foreground"} />
                        <span className="font-bold text-xs uppercase tracking-tight group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {pathname === item.url && (
                            <ChevronRight className="ml-auto size-3 text-primary group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 mb-4 group-data-[collapsible=icon]:hidden">
              <div className="size-9 rounded-full bg-muted border-2 border-border flex items-center justify-center text-xs font-bold shadow-inner">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black truncate uppercase tracking-tight text-sidebar-foreground">{user?.name}</span>
                <span className="text-[10px] text-sidebar-foreground/60 truncate uppercase font-medium">{user?.role}</span>
              </div>
            </div>
            <SidebarMenuButton
              onClick={() => setIsLogoutDialogOpen(true)}
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center h-10"
              tooltip="Cerrar Sesión"
            >
              <LogOut className="size-4" />
              <span className="font-bold text-xs uppercase tracking-widest group-data-[collapsible=icon]:hidden ml-2">Salir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 gap-6">
          <div className="flex flex-col items-center text-center gap-4">
             <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                <LogOut className="size-6" />
             </div>
             <div className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Cerrar Sesión</DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground uppercase leading-relaxed">
                    ¿Estás seguro que deseas salir del panel administrativo?
                </DialogDescription>
             </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
             <Button onClick={handleLogout} className="bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl h-11">
                Confirmar Salida
             </Button>
             <Button variant="ghost" onClick={() => setIsLogoutDialogOpen(false)} className="font-black uppercase text-[10px] tracking-widest rounded-xl h-11">
                Mantenerse
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
