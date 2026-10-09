import {
  Banknote,
  ChevronRight,
  CreditCard,
  DollarSign,
  Coins,
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
} from "@/components/ui/sidebar"
import { roleLabel } from "@/features/auth/domain/services/roleLabel"
import { useLogout } from "@/features/auth/presentation/hooks/useLogout"
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
        {
          title: "Retiros",
          url: "/admin/withdrawals",
          icon: Coins,
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
  const { user } = useAuthStore()
  const {
    isDialogOpen: isLogoutDialogOpen,
    setIsDialogOpen: setIsLogoutDialogOpen,
    isLoggingOut,
    confirmLogout: handleLogout,
  } = useLogout()

  return (
    <Sidebar collapsible="icon" className="border-r-0" {...props}>
      <SidebarHeader className="h-16 border-b border-sidebar-border flex justify-center px-4 group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <DollarSign className="size-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold text-white uppercase text-2xl leading-none tracking-[-0.03em] group-data-[collapsible=icon]:hidden">
            RecaudoPro
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="px-4 py-3 text-xs font-medium text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="h-10 px-4 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                        <item.icon className={pathname === item.url ? "text-sidebar-primary" : "text-sidebar-foreground/70"} />
                        <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {pathname === item.url && (
                            <ChevronRight className="ml-auto size-3 text-sidebar-primary group-data-[collapsible=icon]:hidden" />
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
      <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:px-0">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <div className="flex items-center gap-3 mb-4 group-data-[collapsible=icon]:mb-3 group-data-[collapsible=icon]:justify-center" title={user?.name || "Administrador"}>
              <div className="size-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate text-white">{user?.name || "Administrador"}</span>
                <span className="text-xs text-sidebar-foreground/60 truncate">{user ? roleLabel(user.role) : ""}</span>
              </div>
            </div>
            <SidebarMenuButton
              onClick={() => setIsLogoutDialogOpen(true)}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-white h-10 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
              tooltip="Cerrar sesión"
            >
              <LogOut className="size-4" />
              <span className="text-sm font-medium ml-2 group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-xs rounded-card p-6 gap-6">
          <div className="flex flex-col items-center text-center gap-4">
             <div className="size-12 rounded-tag bg-destructive/10 text-destructive flex items-center justify-center">
                <LogOut className="size-6" />
             </div>
             <div className="space-y-2">
                <DialogTitle className="text-xl font-semibold">¿Cerrar sesión?</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                    ¿Estás seguro que deseas salir del panel administrativo?
                </DialogDescription>
             </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
             <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut} className="h-11">
                {isLoggingOut ? "Cerrando sesión..." : "Confirmar salida"}
             </Button>
             <Button variant="ghost" onClick={() => setIsLogoutDialogOpen(false)} className="h-11">
                Mantenerse
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
