import { useEffect, useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Stats {
  todayRevenue: number
  todayCount: number
  monthRevenue: number
  monthCount: number
  lastMonthRevenue: number
  totalRevenue: number
  totalCount: number
  recentSales: Array<{
    id: number
    total: number
    type: string
    createdAt: string
    customer?: { name: string }
    items: Array<{ product: { name: string }; quantity: number }>
  }>
}

interface LowStockProduct {
  id: number
  name: string
  type: string
  currentStock: number
  minStock: number
  unit: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [statsRes, lowStockRes] = await Promise.all([
      window.api.getSalesStats(),
      window.api.getLowStock()
    ])
    if (statsRes.success) setStats(statsRes.data as Stats)
    if (lowStockRes.success) setLowStock(lowStockRes.data as LowStockProduct[])
    setLoading(false)
  }

  const formatPrice = (price: number) => {
    return (
      new Intl.NumberFormat('fr-DZ', { style: 'decimal', minimumFractionDigits: 0 }).format(price) +
      ' DA'
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const monthGrowth =
    stats && stats.lastMonthRevenue > 0
      ? (((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100).toFixed(1)
      : null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
        <div className="h-80 skeleton rounded-xl" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Revenu Total',
      value: formatPrice(stats?.totalRevenue || 0),
      sub: `${stats?.totalCount || 0} ventes`,
      icon: DollarSign,
      color: 'text-gold'
    },
    {
      label: "Aujourd'hui",
      value: formatPrice(stats?.todayRevenue || 0),
      sub: `${stats?.todayCount || 0} ventes`,
      icon: ShoppingCart,
      color: 'text-success'
    },
    {
      label: 'Ce Mois',
      value: formatPrice(stats?.monthRevenue || 0),
      sub: monthGrowth
        ? `${Number(monthGrowth) >= 0 ? '+' : ''}${monthGrowth}%`
        : `${stats?.monthCount || 0} ventes`,
      icon: Number(monthGrowth || 0) >= 0 ? TrendingUp : TrendingDown,
      color: Number(monthGrowth || 0) >= 0 ? 'text-success' : 'text-danger'
    },
    {
      label: 'Alertes Stock',
      value: lowStock.length.toString(),
      sub: 'produits en rupture',
      icon: AlertTriangle,
      color: lowStock.length > 0 ? 'text-warning' : 'text-success'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-tight text-text">Tableau de bord</h1>
        <p className="text-text-secondary text-[14px] font-medium mt-1 tracking-wide">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="card stat-card p-6 border-transparent shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[12px] font-semibold text-text-muted uppercase tracking-widest">
                {card.label}
              </span>
              <card.icon size={20} className={card.color} strokeWidth={1.5} />
            </div>
            <p className="text-[32px] font-bold text-text mb-1 tracking-tight leading-none">{card.value}</p>
            <p className={`text-[12px] font-semibold mt-2 ${card.color}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="col-span-2 flex flex-col">
          <div className="card flex-1">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-[18px] text-text">Ventes Récentes</h3>
              <Link to="/sales" className="text-[13px] font-medium text-gold-500 hover:text-gold-400 transition-colors">
                Voir toutes les ventes
              </Link>
            </div>
            <div className="table-container border-none rounded-none bg-transparent">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Produits</th>
                    <th>Type</th>
                    <th className="text-right">Montant</th>
                    <th className="text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentSales || []).map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-semibold text-text">{sale.customer?.name || 'Client de passage'}</td>
                      <td className="text-text-secondary text-[13px]">
                        {sale.items.map((i) => `${i.product.name} (×${i.quantity})`).join(', ')}
                      </td>
                      <td>
                        <span
                          className={`badge ${sale.type === 'wholesale' ? 'badge-gold' : 'badge-info'}`}
                        >
                          {sale.type === 'wholesale' ? 'Gros' : 'Détail'}
                        </span>
                      </td>
                      <td className="font-bold text-right text-text">{formatPrice(sale.total)}</td>
                      <td className="text-text-muted text-[13px] font-medium text-right">{formatDate(sale.createdAt)}</td>
                    </tr>
                  ))}
                  {(!stats?.recentSales || stats.recentSales.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-text-muted">
                        Aucune vente récente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Actions + Alerts */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="card p-6 shadow-sm">
            <h3 className="font-semibold text-[18px] text-text mb-6">Actions Rapides</h3>
            <div className="flex flex-col gap-4">
              <Link to="/sales" className="btn btn-gold w-full flex justify-center py-3">
                <ShoppingCart size={18} strokeWidth={2} /> Nouvelle Vente
              </Link>
              <Link to="/products" className="btn btn-outline w-full flex justify-center py-3">
                <Plus size={18} strokeWidth={2} /> Ajouter un Produit
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card p-6 flex-1 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[18px] text-text">Alertes de Stock</h3>
              {lowStock.length > 0 && <span className="badge badge-warning">{lowStock.length}</span>}
            </div>
            {lowStock.length === 0 ? (
              <div className="empty-state py-12">
                <Package size={40} className="mb-4 text-success opacity-80" strokeWidth={1} />
                <p className="text-[14px] font-medium text-text-secondary">Tous les stocks sont optimaux</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {lowStock.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border"
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${p.currentStock <= 0 ? 'bg-danger shadow-[0_0_8px_rgba(224,82,82,0.6)]' : 'bg-warning shadow-[0_0_8px_rgba(212,155,26,0.6)]'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-text truncate">{p.name}</p>
                      <p className="text-[12px] text-text-muted mt-1 font-medium tracking-wide uppercase">
                        {p.currentStock} / {p.minStock} {p.unit}
                      </p>
                    </div>
                    {p.currentStock <= 0 && (
                      <span className="badge badge-danger text-[10px] tracking-widest uppercase">Épuisé</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
