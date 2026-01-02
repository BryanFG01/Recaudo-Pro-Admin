import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExcelExportOptions = {}
): void {
  const { filename = 'export', sheetName = 'Sheet1' } = options

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Convertir datos a worksheet
  const ws = XLSX.utils.json_to_sheet(data)

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Descargar archivo
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportCollectionsToExcel(collections: Array<{
  id: string
  clientName: string
  amount: number
  paymentDate: string
  paymentMethod: string | null
  transactionReference: string | null
  notes: string | null
}>): void {
  const formattedData = collections.map(collection => ({
    'ID': collection.id,
    'Cliente': collection.clientName,
    'Monto': collection.amount,
    'Fecha de Pago': new Date(collection.paymentDate).toLocaleDateString('es-ES'),
    'Método de Pago': collection.paymentMethod || 'N/A',
    'Referencia de Transacción': collection.transactionReference || 'N/A',
    'Notas': collection.notes || 'N/A',
  }))

  exportToExcel(formattedData, {
    filename: `recaudos_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Recaudos',
  })
}


