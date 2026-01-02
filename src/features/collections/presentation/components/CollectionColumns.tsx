import { Column } from '@/shared/components/DynamicTable'
import { CollectionWithClient } from '../../domain/models'
import { formatDateTime, formatCurrency } from '@/shared/utils/date'

export const createCollectionColumns = (): Column<CollectionWithClient>[] => [
  {
    key: 'clientName',
    header: 'Cliente',
    render: (collection) => (
      <span className="font-medium">
        {(collection as CollectionWithClient).clientName || collection.client_id}
      </span>
    ),
  },
  {
    key: 'amount',
    header: 'Monto',
    render: (collection) => formatCurrency(collection.amount),
  },
  {
    key: 'payment_date',
    header: 'Fecha de Pago',
    render: (collection) => formatDateTime(collection.payment_date),
  },
  {
    key: 'payment_method',
    header: 'Método de Pago',
    render: (collection) => {
      const method = collection.payment_method as string | null
      if (!method) return '-'
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            method.toLowerCase() === 'efectivo'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {method}
        </span>
      )
    },
  },
  {
    key: 'transaction_reference',
    header: 'Referencia',
    render: (collection) => collection.transaction_reference || '-',
  },
  {
    key: 'notes',
    header: 'Notas',
    render: (collection) => (
      <span className="text-sm text-gray-600">
        {collection.notes || '-'}
      </span>
    ),
  },
]

