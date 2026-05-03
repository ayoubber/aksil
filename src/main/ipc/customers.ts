import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerCustomerHandlers(): void {
  ipcMain.handle('customers:getAll', async (_event, type?: string) => {
    try {
      const db = getDatabase()
      const where: Record<string, unknown> = {}
      if (type) where.type = type

      const customers = await db.customer.findMany({
        where,
        include: { _count: { select: { sales: true, invoices: true } } },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: customers }
    } catch (error) {
      return { success: false, error: 'Erreur lors du chargement des clients' }
    }
  })

  ipcMain.handle('customers:getById', async (_event, id: number) => {
    try {
      const db = getDatabase()
      const customer = await db.customer.findUnique({
        where: { id },
        include: {
          sales: {
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          invoices: { orderBy: { createdAt: 'desc' }, take: 10 }
        }
      })
      if (!customer) return { success: false, error: 'Client non trouvé' }
      return { success: true, data: customer }
    } catch (error) {
      return { success: false, error: 'Erreur lors du chargement du client' }
    }
  })

  ipcMain.handle(
    'customers:create',
    async (
      _event,
      data: {
        name: string
        type: string
        phone?: string
        email?: string
        address?: string
        notes?: string
      }
    ) => {
      try {
        if (!data.name?.trim()) return { success: false, error: 'Le nom du client est requis' }
        const db = getDatabase()
        const customer = await db.customer.create({ data })
        return { success: true, data: customer }
      } catch (error) {
        return { success: false, error: 'Erreur lors de la création du client' }
      }
    }
  )

  ipcMain.handle(
    'customers:update',
    async (
      _event,
      id: number,
      data: Partial<{
        name: string
        type: string
        phone: string
        email: string
        address: string
        notes: string
      }>
    ) => {
      try {
        if (data.name !== undefined && !data.name.trim())
          return { success: false, error: 'Le nom est requis' }
        const db = getDatabase()
        const customer = await db.customer.update({ where: { id }, data })
        return { success: true, data: customer }
      } catch (error) {
        return { success: false, error: 'Erreur lors de la mise à jour du client' }
      }
    }
  )

  ipcMain.handle('customers:delete', async (_event, id: number) => {
    try {
      const db = getDatabase()
      const count = await db.sale.count({ where: { customerId: id } })
      if (count > 0) return { success: false, error: 'Client avec des ventes existantes' }
      await db.customer.delete({ where: { id } })
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la suppression du client' }
    }
  })
}
