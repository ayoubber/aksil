import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerProductHandlers(): void {
  ipcMain.handle('products:getAll', async () => {
    try {
      const db = getDatabase()
      const products = await db.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          inventoryMovements: true
        }
      })

      return {
        success: true,
        data: products.map((p) => ({
          ...p,
          currentStock: p.inventoryMovements.reduce((sum, m) => {
            return m.type === 'IN' ? sum + m.quantity : sum - m.quantity
          }, 0),
          inventoryMovements: undefined
        }))
      }
    } catch (error) {
      console.error('Get products error:', error)
      return { success: false, error: 'Erreur lors du chargement des produits' }
    }
  })

  ipcMain.handle('products:getById', async (_event, id: number) => {
    try {
      const db = getDatabase()
      const product = await db.product.findUnique({
        where: { id },
        include: { inventoryMovements: true }
      })

      if (!product) {
        return { success: false, error: 'Produit non trouvé' }
      }

      const currentStock = product.inventoryMovements.reduce((sum, m) => {
        return m.type === 'IN' ? sum + m.quantity : sum - m.quantity
      }, 0)

      return {
        success: true,
        data: { ...product, currentStock, inventoryMovements: undefined }
      }
    } catch (error) {
      console.error('Get product error:', error)
      return { success: false, error: 'Erreur lors du chargement du produit' }
    }
  })

  ipcMain.handle(
    'products:create',
    async (
      _event,
      data: {
        name: string
        type: string
        description?: string
        unit: string
        buyPrice: number
        sellPrice: number
        wholesale?: number
        minStock: number
        imageUrl?: string
      }
    ) => {
      try {
        // Validation
        if (!data.name || data.name.trim().length === 0) {
          return { success: false, error: 'Le nom du produit est requis' }
        }
        if (!data.type || data.type.trim().length === 0) {
          return { success: false, error: 'Le type de miel est requis' }
        }
        if (data.buyPrice < 0 || data.sellPrice < 0) {
          return { success: false, error: 'Les prix doivent être positifs' }
        }
        if (data.sellPrice <= data.buyPrice) {
          return { success: false, error: "Le prix de vente doit être supérieur au prix d'achat" }
        }

        const db = getDatabase()
        const product = await db.product.create({ data })
        return { success: true, data: product }
      } catch (error) {
        console.error('Create product error:', error)
        return { success: false, error: 'Erreur lors de la création du produit' }
      }
    }
  )

  ipcMain.handle(
    'products:update',
    async (
      _event,
      id: number,
      data: Partial<{
        name: string
        type: string
        description: string
        unit: string
        buyPrice: number
        sellPrice: number
        wholesale: number
        minStock: number
        imageUrl: string
        isActive: boolean
      }>
    ) => {
      try {
        if (data.name !== undefined && data.name.trim().length === 0) {
          return { success: false, error: 'Le nom du produit est requis' }
        }

        const db = getDatabase()
        const product = await db.product.update({ where: { id }, data })
        return { success: true, data: product }
      } catch (error) {
        console.error('Update product error:', error)
        return { success: false, error: 'Erreur lors de la mise à jour du produit' }
      }
    }
  )

  ipcMain.handle('products:delete', async (_event, id: number) => {
    try {
      const db = getDatabase()
      await db.product.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (error) {
      console.error('Delete product error:', error)
      return { success: false, error: 'Erreur lors de la suppression du produit' }
    }
  })

  ipcMain.handle('products:getLowStock', async () => {
    try {
      const db = getDatabase()
      const products = await db.product.findMany({
        where: { isActive: true },
        include: { inventoryMovements: true }
      })

      const lowStock = products
        .map((p) => {
          const currentStock = p.inventoryMovements.reduce((sum, m) => {
            return m.type === 'IN' ? sum + m.quantity : sum - m.quantity
          }, 0)
          return { ...p, currentStock, inventoryMovements: undefined }
        })
        .filter((p) => p.currentStock <= p.minStock)

      return { success: true, data: lowStock }
    } catch (error) {
      console.error('Get low stock error:', error)
      return { success: false, error: 'Erreur lors du chargement des alertes de stock' }
    }
  })
}
