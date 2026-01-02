import { Column } from '@/shared/components/DynamicTable'
import { Client } from '../../domain/models'
import { formatDate } from '@/shared/utils/date'

export const createClientColumns = (): Column<Client>[] => [
  {
    key: 'name',
    header: 'Nombre',
    render: (client) => <span className="font-medium">{client.name}</span>,
  },
  {
    key: 'phone',
    header: 'Teléfono',
  },
  {
    key: 'document_id',
    header: 'Documento',
    render: (client) => client.document_id || '-',
  },
  {
    key: 'address',
    header: 'Dirección',
    render: (client) => client.address || '-',
  },
  {
    key: 'created_at',
    header: 'Fecha de Creación',
    render: (client) => formatDate(client.created_at),
  },
]

