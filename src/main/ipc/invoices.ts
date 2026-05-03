import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerInvoiceHandlers(): void {
  ipcMain.handle(
    'invoices:getAll',
    async (_event, filters?: { status?: string; customerId?: number }) => {
      try {
        const db = getDatabase()
        const where: Record<string, unknown> = {}
        if (filters?.status) where.status = filters.status
        if (filters?.customerId) where.customerId = filters.customerId

        const invoices = await db.invoice.findMany({
          where,
          include: { customer: true, items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' }
        })
        return { success: true, data: invoices }
      } catch (error) {
        return { success: false, error: 'Erreur lors du chargement des factures' }
      }
    }
  )

  ipcMain.handle('invoices:getById', async (_event, id: number) => {
    try {
      const db = getDatabase()
      const invoice = await db.invoice.findUnique({
        where: { id },
        include: { customer: true, items: { include: { product: true } } }
      })
      if (!invoice) return { success: false, error: 'Facture non trouvée' }
      return { success: true, data: invoice }
    } catch (error) {
      return { success: false, error: 'Erreur lors du chargement de la facture' }
    }
  })

  ipcMain.handle(
    'invoices:create',
    async (
      _event,
      data: {
        customerId: number
        tax: number
        notes?: string
        dueDate?: string
        items: Array<{ productId: number; quantity: number; unitPrice: number }>
      }
    ) => {
      try {
        if (!data.customerId) return { success: false, error: 'Le client est requis' }
        if (!data.items?.length)
          return { success: false, error: 'La facture doit contenir des articles' }

        const db = getDatabase()
        const count = await db.invoice.count()
        const now = new Date()
        const number = `FAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`

        const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        const taxAmount = subtotal * (data.tax / 100)
        const total = subtotal + taxAmount

        const invoice = await db.invoice.create({
          data: {
            number,
            customerId: data.customerId,
            total,
            tax: data.tax,
            status: 'draft',
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            notes: data.notes,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.unitPrice * item.quantity
              }))
            }
          },
          include: { customer: true, items: { include: { product: true } } }
        })
        return { success: true, data: invoice }
      } catch (error) {
        return { success: false, error: 'Erreur lors de la création de la facture' }
      }
    }
  )

  ipcMain.handle('invoices:updateStatus', async (_event, id: number, status: string) => {
    try {
      if (!['draft', 'sent', 'paid'].includes(status)) {
        return { success: false, error: 'Statut invalide' }
      }
      const db = getDatabase()
      const invoice = await db.invoice.update({
        where: { id },
        data: { status },
        include: { customer: true, items: { include: { product: true } } }
      })
      return { success: true, data: invoice }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour du statut' }
    }
  })

  ipcMain.handle('invoices:delete', async (_event, id: number) => {
    try {
      const db = getDatabase()
      const invoice = await db.invoice.findUnique({ where: { id } })
      if (invoice?.status === 'paid') {
        return { success: false, error: 'Impossible de supprimer une facture payée' }
      }
      await db.invoice.delete({ where: { id } })
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la suppression de la facture' }
    }
  })
}
