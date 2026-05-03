import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerSalesHandlers(): void {
  ipcMain.handle(
    'sales:getAll',
    async (
      _event,
      filters?: {
        type?: string
        status?: string
        startDate?: string
        endDate?: string
        customerId?: number
      }
    ) => {
      try {
        const db = getDatabase()
        const where: Record<string, unknown> = {}

        if (filters?.type) where.type = filters.type
        if (filters?.status) where.status = filters.status
        if (filters?.customerId) where.customerId = filters.customerId
        if (filters?.startDate || filters?.endDate) {
          where.createdAt = {}
          if (filters.startDate)
            (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate)
          if (filters.endDate)
            (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate)
        }

        const sales = await db.sale.findMany({
          where,
          include: {
            customer: true,
            items: { include: { product: true } }
          },
          orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: sales }
      } catch (error) {
        console.error('Get sales error:', error)
        return { success: false, error: 'Erreur lors du chargement des ventes' }
      }
    }
  )

  ipcMain.handle(
    'sales:create',
    async (
      _event,
      data: {
        customerId?: number
        type: string
        discount: number
        notes?: string
        items: Array<{
          productId: number
          quantity: number
          unitPrice: number
        }>
      }
    ) => {
      try {
        // Validation
        if (!data.items || data.items.length === 0) {
          return { success: false, error: 'La vente doit contenir au moins un article' }
        }

        for (const item of data.items) {
          if (item.quantity <= 0) {
            return { success: false, error: 'Les quantités doivent être positives' }
          }
          if (item.unitPrice < 0) {
            return { success: false, error: 'Les prix doivent être positifs' }
          }
        }

        const db = getDatabase()

        // Verify stock for each item
        for (const item of data.items) {
          const movements = await db.inventoryMovement.findMany({
            where: { productId: item.productId }
          })
          const currentStock = movements.reduce((sum, m) => {
            return m.type === 'IN' ? sum + m.quantity : sum - m.quantity
          }, 0)

          if (currentStock < item.quantity) {
            const product = await db.product.findUnique({ where: { id: item.productId } })
            return {
              success: false,
              error: `Stock insuffisant pour "${product?.name}" (disponible: ${currentStock})`
            }
          }
        }

        const itemsTotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        const total = itemsTotal - data.discount

        const sale = await db.sale.create({
          data: {
            customerId: data.customerId || null,
            type: data.type,
            total,
            discount: data.discount,
            paid: total,
            status: 'completed',
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
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        })

        // Create OUT movements for inventory
        for (const item of data.items) {
          await db.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              quantity: item.quantity,
              reason: 'Vente',
              reference: `SALE-${sale.id}`
            }
          })
        }

        return { success: true, data: sale }
      } catch (error) {
        console.error('Create sale error:', error)
        return { success: false, error: 'Erreur lors de la création de la vente' }
      }
    }
  )

  ipcMain.handle('sales:getById', async (_event, id: number) => {
    try {
      const db = getDatabase()
      const sale = await db.sale.findUnique({
        where: { id },
        include: {
          customer: true,
          items: { include: { product: true } }
        }
      })

      if (!sale) {
        return { success: false, error: 'Vente non trouvée' }
      }

      return { success: true, data: sale }
    } catch (error) {
      console.error('Get sale error:', error)
      return { success: false, error: 'Erreur lors du chargement de la vente' }
    }
  })

  ipcMain.handle('sales:getStats', async () => {
    try {
      const db = getDatabase()
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const [todaySales, monthSales, lastMonthSales, totalSales, recentSales] = await Promise.all([
        db.sale.aggregate({
          where: { status: 'completed', createdAt: { gte: todayStart } },
          _sum: { total: true },
          _count: true
        }),
        db.sale.aggregate({
          where: { status: 'completed', createdAt: { gte: monthStart } },
          _sum: { total: true },
          _count: true
        }),
        db.sale.aggregate({
          where: {
            status: 'completed',
            createdAt: { gte: lastMonthStart, lt: monthStart }
          },
          _sum: { total: true }
        }),
        db.sale.aggregate({
          where: { status: 'completed' },
          _sum: { total: true },
          _count: true
        }),
        db.sale.findMany({
          where: { status: 'completed' },
          include: { customer: true, items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ])

      // Revenue by day for the last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const dailySales = await db.sale.findMany({
        where: { status: 'completed', createdAt: { gte: thirtyDaysAgo } },
        select: { total: true, createdAt: true }
      })

      const revenueByDay: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = date.toISOString().split('T')[0]
        revenueByDay[key] = 0
      }
      for (const sale of dailySales) {
        const key = sale.createdAt.toISOString().split('T')[0]
        if (revenueByDay[key] !== undefined) {
          revenueByDay[key] += sale.total
        }
      }

      const chartData = Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue)
      }))

      return {
        success: true,
        data: {
          todayRevenue: todaySales._sum.total || 0,
          todayCount: todaySales._count,
          monthRevenue: monthSales._sum.total || 0,
          monthCount: monthSales._count,
          lastMonthRevenue: lastMonthSales._sum.total || 0,
          totalRevenue: totalSales._sum.total || 0,
          totalCount: totalSales._count,
          recentSales,
          chartData
        }
      }
    } catch (error) {
      console.error('Get stats error:', error)
      return { success: false, error: 'Erreur lors du chargement des statistiques' }
    }
  })
}
