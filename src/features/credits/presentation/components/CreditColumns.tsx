import { Column } from '@/shared/components/DynamicTable'
import { Credit } from '../../domain/models'
import { formatDate, formatCurrency } from '@/shared/utils/date'

export const createCreditColumns = (): Column<Credit>[] => [
  {
    key: 'client_id',
    header: 'Cliente ID',
  },
  {
    key: 'total_amount',
    header: 'Monto Total',
    render: (credit) => formatCurrency(credit.total_amount as number),
  },
  {
    key: 'total_balance',
    header: 'Saldo Restante',
    render: (credit) => {
      const balance = credit.total_balance as number
      return (
        <span className={balance === 0 ? 'text-success font-semibold' : ''}>
          {formatCurrency(balance)}
        </span>
      )
    },
  },
  {
    key: 'installment_amount',
    header: 'Valor Cuota',
    render: (credit) => formatCurrency(credit.installment_amount as number),
  },
  {
    key: 'paid_installments',
    header: 'Cuotas Pagadas',
    render: (credit) => (
      <span>
        {credit.paid_installments} / {credit.total_installments}
      </span>
    ),
  },
  {
    key: 'overdue_installments',
    header: 'Cuotas Atrasadas',
    render: (credit) => {
      const overdue = credit.overdue_installments as number
      return (
        <span className={overdue > 0 ? 'text-error font-semibold' : ''}>
          {overdue}
        </span>
      )
    },
  },
  {
    key: 'next_due_date',
    header: 'Próxima Fecha',
    render: (credit) =>
      credit.next_due_date ? formatDate(credit.next_due_date) : '-',
  },
]

