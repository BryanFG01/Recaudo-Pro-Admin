import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0f171a] via-[#0f171a] to-[#0f171a]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-6 text-gray-200"
          role="main"
          aria-label="Contenido principal"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
