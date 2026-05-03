import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerInventoryHandlers(): void {
  ipcMain.handle(
    'inventory:getMovements',
    async (
      _event,
      filters?: {
        productId?: number
        type?: string
        startDate?: string
        endDate?: string
      }
    ) => {
      try {
        const db = getDatabase()
        const where: Record<string, unknown> = {}

        if (filters?.productId) where.productId = filters.productId
        if (filters?.type) where.type = filters.type
        if (filters?.startDate || filters?.endDate) {
          where.createdAt = {}
          if (filters.startDate)
            (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate)
          if (filters.endDate)
            (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate)
        }

        const movements = await db.inventoryMovement.findMany({
          where,
          include: { product: true },
          orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: movements }
      } catch (error) {
        console.error('Get movements error:', error)
        return { success: false, error: 'Erreur lors du chargement des mouvements' }
      }
    }
  )

  ipcMain.handle(
    'inventory:addMovement',
    async (
      _event,
      data: {
        productId: number
        type: string
        quantity: number
        reason?: string
        reference?: string
      }
    ) => {
      try {
        // Validation
        if (!data.productId) {
          return { success: false, error: 'Le produit est requis' }
        }
        if (!['IN', 'OUT', 'ADJUSTMENT'].includes(data.type)) {
          return { success: false, error: 'Type de mouvement invalide' }
        }
        if (data.quantity <= 0) {
          return { success: false, error: 'La quantité doit être positive' }
        }

        const db = getDatabase()

        // Check stock for OUT movements
        if (data.type === 'OUT') {
          const movements = await db.inventoryMovement.findMany({
            where: { productId: data.productId }
          })
          const currentStock = movements.reduce((sum, m) => {
            return m.type === 'IN' ? sum + m.quantity : sum - m.quantity
          }, 0)

          if (currentStock < data.quantity) {
            return { success: false, error: `Stock insuffisant (disponible: ${currentStock})` }
          }
        }

        const movement = await db.inventoryMovement.create({
          data,
          include: { product: true }
        })

        return { success: true, data: movement }
      } catch (error) {
        console.error('Add movement error:', error)
        return { success: false, error: "Erreur lors de l'ajout du mouvement" }
      }
    }
  )

  ipcMain.handle('inventory:getStockLevels', async () => {
    try {
      const db = getDatabase()
      const products = await db.product.findMany({
        where: { isActive: true },
        include: { inventoryMovements: true }
      })

      const stockLevels = products.map((p) => {
        const currentStock = p.inventoryMovements.reduce((sum, m) => {
          return m.type === 'IN' ? sum + m.quantity : sum - m.quantity
        }, 0)
        const stockValue = currentStock * p.buyPrice
        const isLowStock = currentStock <= p.minStock

        return {
          id: p.id,
          name: p.name,
          type: p.type,
          unit: p.unit,
          currentStock,
          minStock: p.minStock,
          buyPrice: p.buyPrice,
          sellPrice: p.sellPrice,
          stockValue,
          isLowStock
        }
      })

      return { success: true, data: stockLevels }
    } catch (error) {
      console.error('Get stock levels error:', error)
      return { success: false, error: 'Erreur lors du chargement des niveaux de stock' }
    }
  })
}
