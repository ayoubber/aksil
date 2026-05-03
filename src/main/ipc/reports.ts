import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerReportHandlers(): void {
  ipcMain.handle('reports:salesReport', async (_event, period: string) => {
    try {
      const db = getDatabase()
      const now = new Date()
      let startDate: Date

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      const sales = await db.sale.findMany({
        where: { status: 'completed', createdAt: { gte: startDate } },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      })

      const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
      const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0)
      const retailSales = sales.filter((s) => s.type === 'retail')
      const wholesaleSales = sales.filter((s) => s.type === 'wholesale')

      // Top products
      const productMap: Record<number, { name: string; quantity: number; revenue: number }> = {}
      for (const sale of sales) {
        for (const item of sale.items) {
          if (!productMap[item.productId]) {
            productMap[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 }
          }
          productMap[item.productId].quantity += item.quantity
          productMap[item.productId].revenue += item.total
        }
      }
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Top customers
      const customerMap: Record<number, { name: string; purchases: number; total: number }> = {}
      for (const sale of sales) {
        if (sale.customerId && sale.customer) {
          if (!customerMap[sale.customerId]) {
            customerMap[sale.customerId] = { name: sale.customer.name, purchases: 0, total: 0 }
          }
          customerMap[sale.customerId].purchases++
          customerMap[sale.customerId].total += sale.total
        }
      }
      const topCustomers = Object.values(customerMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)

      return {
        success: true,
        data: {
          totalRevenue,
          totalDiscount,
          salesCount: sales.length,
          retailCount: retailSales.length,
          retailRevenue: retailSales.reduce((s, sale) => s + sale.total, 0),
          wholesaleCount: wholesaleSales.length,
          wholesaleRevenue: wholesaleSales.reduce((s, sale) => s + sale.total, 0),
          topProducts,
          topCustomers,
          sales
        }
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la génération du rapport' }
    }
  })

  ipcMain.handle('reports:inventoryValuation', async () => {
    try {
      const db = getDatabase()
      const products = await db.product.findMany({
        where: { isActive: true },
        include: { inventoryMovements: true }
      })

      const data = products.map((p) => {
        const stock = p.inventoryMovements.reduce(
          (sum, m) => (m.type === 'IN' ? sum + m.quantity : sum - m.quantity),
          0
        )
        return {
          name: p.name,
          type: p.type,
          stock,
          buyPrice: p.buyPrice,
          sellPrice: p.sellPrice,
          costValue: stock * p.buyPrice,
          retailValue: stock * p.sellPrice
        }
      })

      const totalCost = data.reduce((s, d) => s + d.costValue, 0)
      const totalRetail = data.reduce((s, d) => s + d.retailValue, 0)

      return {
        success: true,
        data: { products: data, totalCost, totalRetail, potentialProfit: totalRetail - totalCost }
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors du calcul de la valeur du stock' }
    }
  })
}
