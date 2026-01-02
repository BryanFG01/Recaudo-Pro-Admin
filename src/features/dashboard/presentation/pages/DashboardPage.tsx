import { useState, useEffect } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useAuthStore } from '@/features/auth/presentation/store/authStore'
import { useAuth } from '@/features/auth/presentation/hooks/useAuth'
import StatsCard from '@/shared/components/StatsCard/StatsCard'
import { CollectionChart, CreditStatusChart } from '../components'
import { DollarSign, AlertTriangle, CreditCard, UserCog } from 'lucide-react'
import { DynamicTable, Column } from '@/shared/components/DynamicTable'
import { User } from '@/features/auth/domain/models'

export default function DashboardPage() {
  const { businessId, user } = useAuthStore()
  const { getUsersByBusinessId } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<0 | 1 | 2>(1) // 0: Hoy, 1: Semana, 2: Mes
  const [request, setRequest] = useState<{ startDate?: Date; endDate?: Date }>({})
  const [vendors, setVendors] = useState<User[]>([])
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)

  const currentBusinessId = user?.business_id || businessId

  useEffect(() => {
    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date | undefined

    switch (selectedPeriod) {
      case 0: // Hoy
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
        break
      case 1: // Semana
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate.setDate(endDate.getDate() + 1)
        break
      case 2: // Mes
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
    }

    setRequest({ startDate, endDate })
  }, [selectedPeriod])

  useEffect(() => {
    if (currentBusinessId) {
      loadVendors()
    }
  }, [currentBusinessId])

  const loadVendors = async () => {
    if (!currentBusinessId) return
    setIsLoadingVendors(true)
    try {
      const users = await getUsersByBusinessId(currentBusinessId)
      setVendors(users)
    } catch (err) {
      console.error('Error al cargar vendedores:', err)
    } finally {
      setIsLoadingVendors(false)
    }
  }

  const { stats, isLoading, error } = useDashboard({
    ...request,
    businessId: currentBusinessId || undefined,
  })

  const vendorColumns: Column<User>[] = [
    { key: 'email', header: 'Email', className: 'font-medium' },
    { key: 'name', header: 'Nombre', render: (user) => user.name || '-' },
    { key: 'phone', header: 'Teléfono', render: (user) => user.phone || '-' },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {user.role}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (user) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {user.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar estadísticas: {error.message}</p>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod(0)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 0
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setSelectedPeriod(1)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 1
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setSelectedPeriod(2)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === 2
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Recaudado"
          value={stats.totalCollected}
          isCurrency
          icon={<DollarSign className="w-8 h-8" />}
        />
        <StatsCard
          title="Créditos Activos"
          value={stats.activeCredits}
          icon={<CreditCard className="w-8 h-8" />}
        />
        <StatsCard
          title="Clientes en Mora"
          value={stats.clientsInArrears}
          isWarning
          icon={<AlertTriangle className="w-8 h-8" />}
        />
      </div>

      {/* Payment Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Efectivo"
          value={stats.cashCollection}
          isCurrency
          subtitle={`${stats.cashCount} pagos`}
        />
        <StatsCard
          title="Transacción"
          value={stats.transactionCollection}
          isCurrency
          subtitle={`${stats.transactionCount} pagos`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollectionChart
          data={stats.weeklyCollectionData}
          period={selectedPeriod === 0 ? 'day' : selectedPeriod === 1 ? 'week' : 'month'}
        />
        <CreditStatusChart
          upToDatePercentage={stats.upToDatePercentage}
          overduePercentage={stats.overduePercentage}
          activeCredits={stats.activeCredits}
          clientsInArrears={stats.clientsInArrears}
        />
      </div>

      {/* Vendedores */}
      {currentBusinessId && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCog className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Vendedores</h2>
            <span className="text-sm text-gray-500">({vendors.length} {vendors.length === 1 ? 'vendedor' : 'vendedores'})</span>
          </div>
          <DynamicTable
            data={vendors}
            columns={vendorColumns}
            isLoading={isLoadingVendors}
            emptyMessage="No hay vendedores disponibles"
          />
        </div>
      )}
    </div>
  )
}


