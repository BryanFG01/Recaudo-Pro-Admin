import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import Header from "./Header"
import { AppSidebar } from "./AppSidebar"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-w-0 bg-background transition-colors duration-300">
        <Header />
        <main
          className="flex-1 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500"
          role="main"
          id="main-content"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
