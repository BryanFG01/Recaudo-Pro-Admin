import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreateUserModal } from '../components/CreateUserModal'

export default function CreateUserPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    router.push('/admin/users')
  }

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      
      <CreateUserModal 
        isOpen={isOpen} 
        onClose={handleClose} 
        onSuccess={() => router.push('/admin/users')}
      />
    </div>
  )
}
