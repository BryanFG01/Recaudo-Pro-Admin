import { LoadingScreen } from '@/shared/components/LoadingScreen/LoadingScreen'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Column, DynamicTable } from '@/shared/components/DynamicTable'
import { cn } from '@/shared/utils/cn'
import { formatDate } from '@/shared/utils/date'
import { exportToExcel } from '@/shared/utils/excel'
import { Download, Plus, Trash2, Users, UserCheck, Shield, HardHat, MoreHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { User } from '../../domain/models'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { CreateUserModal } from '../components/CreateUserModal'
import StatsCard from '@/shared/components/StatsCard/StatsCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminUsersPage() {
  const { businessId } = useAuthStore()
  const { getUsersByBusinessId, deleteUser, updateUserActive } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingIdentifier, setUpdatingIdentifier] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    if (businessId) {
      loadUsers()
    }
  }, [businessId])

  const loadUsers = async () => {
    if (!businessId) return

    setIsLoading(true)
    setError(null)

    try {
      const businessUsers = await getUsersByBusinessId(businessId)
      setUsers(businessUsers)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener usuarios'
      setError(errorMessage)
      console.error('Error al obtener usuarios:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter(u => u.is_active).length
    const admins = users.filter(u => u.role === 'admin').length
    const collectors = users.filter(u => u.role === 'cobrador').length

    return [
      { label: 'Total Equipo', value: total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Activos', value: active, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { label: 'Administradores', value: admins, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { label: 'Recaudadores', value: collectors, icon: HardHat, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ]
  }, [users])

  const handleExport = () => {
    const dataToExport = users.map((user) => ({
      Nombre: user.name || 'N/A',
      Teléfono: user.phone || 'N/A',
      Rol: user.role,
      'Código Empleado': user.employee_code || 'N/A',
      'Comisión %': user.commission_percentage !== null ? `${user.commission_percentage}%` : 'N/A',
      Estado: user.is_active ? 'Activo' : 'Inactivo',
      'Fecha Creación': formatDate(user.created_at)
    }))
    exportToExcel(dataToExport, { filename: 'usuarios_recaudopro', sheetName: 'Usuarios' })
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const cancelDeleteMode = useCallback(() => {
    setDeleteMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    setError(null)
    try {
      for (const id of selectedIds) {
        const result = await deleteUser(id)
        if (!result.success) {
          setError(result.error ?? 'Error al eliminar usuario')
          return
        }
      }
      await loadUsers()
      setSelectedIds(new Set())
      setDeleteMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = useCallback(
    async (user: User, nextActive: boolean) => {
      if (!user.id) return
      setUpdatingIdentifier(user.id)
      setError(null)
      try {
        const result = await updateUserActive(user.id, nextActive)
        if (result.success && result.user) {
          setUsers((prev) => prev.map((u) => (u.id === result.user!.id ? result.user! : u)))
        } else {
          setError(result.error ?? 'Error al actualizar estado')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar estado')
      } finally {
        setUpdatingIdentifier(null)
      }
    },
    [updateUserActive]
  )


  const baseColumns: Column<User>[] = [
    {
      key: 'name',
      header: 'Colaborador',
      className: 'min-w-[200px]',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-foreground truncate">{user.name || '-'}</span>
            <span className="text-[10px] text-muted-foreground truncate font-medium uppercase tracking-tight">{user.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border',
            user.role === 'admin'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : user.role === 'supervisor'
              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          )}
        >
          {user.role}
        </span>
      )
    },
    {
      key: 'number',
      header: 'ID',
      className: 'text-center tabular-nums',
      render: (user) => <span className="text-[11px] font-bold text-slate-400">#{user.number || '-'}</span>
    },
    {
      key: 'commission_percentage',
      header: 'Comisión',
      isNumeric: true,
      render: (user) => (
        <span className="text-foreground font-bold tabular-nums">
          {user.commission_percentage !== null ? `${user.commission_percentage}%` : '-'}
        </span>
      )
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (user) => {
        const isUpdating = user.id != null && updatingIdentifier === user.id
        return (
          <div className="flex items-center gap-2">
            <div className={cn(
                "size-1.5 rounded-full animate-pulse",
                user.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10"
            )} />
            <Switch
              checked={user.is_active}
              onCheckedChange={(checked) => handleToggleActive(user, checked)}
              disabled={isUpdating || deleteMode}
              className="h-5 w-9 data-[state=checked]:bg-emerald-500 shadow-sm"
            />
          </div>
        )
      }
    },
    {
        key: '_actions',
        header: '',
        className: 'w-10',
        render: () => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-card border-border shadow-xl rounded-xl">
                    <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight py-2.5 cursor-pointer text-foreground/70 focus:bg-accent focus:text-foreground">
                        Editar Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight py-2.5 text-info cursor-pointer focus:bg-accent">
                        Ver Actividad
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight py-2.5 text-error cursor-pointer focus:bg-accent" onClick={() => {}}>
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
  ]

  const selectColumn: Column<User> = {
    key: '_select',
    header: 'Sel',
    render: (u) => (
      <input
        type="checkbox"
        checked={selectedIds.has(u.id)}
        onChange={() => toggleSelect(u.id || '')}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
      />
    )
  }

  const columns: Column<User>[] = deleteMode ? [selectColumn, ...baseColumns] : baseColumns

  if (!businessId || isLoading) {
    return <LoadingScreen message="Sincronizando Equipo de Trabajo" />
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header ERP */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/10 pb-6 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Equipo de Trabajo</h1>
          <p className="text-sm font-semibold text-muted-foreground/70 uppercase tracking-widest">
            Gestión de roles y configuración de cobradores
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-11 px-6 font-bold uppercase tracking-[0.1em] text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl"
            >
                <Plus className="w-4 h-4 mr-2" />
                Alta Usuario
            </Button>
            <Button
                onClick={handleExport}
                disabled={users.length === 0}
                variant="outline"
                className="h-11 px-6 font-bold uppercase tracking-[0.1em] text-[11px] border-border hover:bg-accent rounded-xl"
            >
                <Download className="w-4 h-4 mr-2" />
                Exportar
            </Button>
        </div>
      </div>

      {/* Stats Cards ERP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={<stat.icon className="size-5" />}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Tabla de Datos */}
      <div className="flex flex-col gap-4">
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0 shadow-[0_0_15px_-5px_theme(colors.primary.DEFAULT)]">
                        <Users className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Listado de Colaboradores</h3>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Equipo operativo registrado</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-9 w-9 rounded-xl transition-all", deleteMode ? "bg-destructive/20 text-destructive" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900")} 
                        onClick={() => setDeleteMode(!deleteMode)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            {deleteMode && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-in slide-in-from-top-2 duration-300">
                    <span className="text-[10px] font-black uppercase text-destructive tracking-widest">Modo Selección Activo: {selectedIds.size} seleccionados</span>
                    <div className="flex gap-2">
                        <Button onClick={cancelDeleteMode} variant="ghost" className="h-8 px-4 text-[10px] font-bold uppercase text-white/60 hover:text-white">Cancelar</Button>
                        <Button onClick={handleDeleteSelected} disabled={selectedIds.size === 0 || isDeleting} className="h-8 px-4 bg-destructive text-white font-bold text-[10px] uppercase rounded-lg">Eliminar</Button>
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1">
            <DynamicTable
                data={users}
                columns={columns}
                isLoading={isLoading}
                error={error}
                emptyMessage="No hay colaboradores registrados"
                className="rounded-3xl"
                variant="premium-dark"
            />
        </div>
      </div>

      <CreateUserModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={loadUsers} 
      />
    </div>
  )
}
