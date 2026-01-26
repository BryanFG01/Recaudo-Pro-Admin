import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#1a2436] via-[#1a2436] to-[#0f172a]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 text-gray-200" role="main" aria-label="Contenido principal">
          {children}
        </main>
      </div>
    </div>
  )
}


