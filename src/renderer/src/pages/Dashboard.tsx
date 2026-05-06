import { useEffect, useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Stats {
  todayRevenue: number
  todayCount: number
  monthRevenue: number
  monthCount: number
  lastMonthRevenue: number
  totalRevenue: number
  totalCount: number
  chartData: Array<{ date: string; revenue: number }>
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

// ── Stat Card ───────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  subPositive,
  icon: Icon,
  accent = false,
}: {
  label: string
  value: string
  sub: string
  subPositive?: boolean
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div
      className="card stat-card"
      style={{
        padding: '22px 24px 20px',
        border: accent ? '1px solid rgba(232,168,48,0.22)' : '1px solid var(--color-border)',
        background: accent
          ? 'linear-gradient(135deg, rgba(232,168,48,0.06) 0%, var(--color-surface-elevated) 60%)'
          : 'var(--color-surface-elevated)',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}>
          {label}
        </span>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: accent ? 'rgba(232,168,48,0.15)' : 'rgba(255,255,255,0.04)',
          border: accent ? '1px solid rgba(232,168,48,0.20)' : '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent ? 'var(--color-gold-500)' : 'var(--color-text-muted)',
        }}>
          <Icon size={14} strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: accent ? 'var(--color-gold-400)' : 'var(--color-text)',
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {value}
      </div>

      {/* Sub */}
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: subPositive === true
          ? 'var(--color-success)'
          : subPositive === false
            ? 'var(--color-danger)'
            : 'var(--color-text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {subPositive === true && <TrendingUp size={12} />}
        {subPositive === false && <TrendingDown size={12} />}
        {sub}
      </div>
    </div>
  )
}

// ── Custom Tooltip ───────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const date = new Date(label).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  const value = payload[0]?.value ?? 0
  return (
    <div style={{
      background: 'var(--color-surface-elevated)',
      border: '1px solid rgba(232,168,48,0.20)',
      borderRadius: 10,
      padding: '8px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.40)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>{date}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--color-gold-400)',
      }}>
        {new Intl.NumberFormat('fr-DZ').format(value)} DA
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

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

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-DZ', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' DA'

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const monthGrowthNum = stats && stats.lastMonthRevenue > 0
    ? ((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
    : null

  // Trim chart data to last 14 days for cleaner look
  const chartData = (stats?.chartData || []).slice(-14)

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="skeleton" style={{ height: 280 }} />
          <div className="skeleton" style={{ height: 280 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 32px 40px', maxWidth: 1280 }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-text)',
          }}>
            Tableau de bord
          </h1>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-gold-500)',
            boxShadow: '0 0 10px rgba(232,168,48,0.60)',
          }} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard
          label="Revenu Total"
          value={fmt(stats?.totalRevenue || 0)}
          sub={`${stats?.totalCount || 0} ventes au total`}
          icon={DollarSign}
          accent
        />
        <StatCard
          label="Aujourd'hui"
          value={fmt(stats?.todayRevenue || 0)}
          sub={`${stats?.todayCount || 0} ventes`}
          icon={ShoppingCart}
        />
        <StatCard
          label="Ce Mois"
          value={fmt(stats?.monthRevenue || 0)}
          sub={
            monthGrowthNum !== null
              ? `${monthGrowthNum >= 0 ? '+' : ''}${monthGrowthNum.toFixed(1)}% vs. mois dernier`
              : `${stats?.monthCount || 0} ventes`
          }
          subPositive={monthGrowthNum !== null ? monthGrowthNum >= 0 : undefined}
          icon={monthGrowthNum !== null && monthGrowthNum >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Alertes Stock"
          value={lowStock.length.toString()}
          sub={lowStock.length === 0 ? 'Tous les stocks OK' : `${lowStock.length} produit(s) en alerte`}
          subPositive={lowStock.length === 0 ? true : false}
          icon={AlertTriangle}
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Revenue Chart */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
                  Revenus — 14 derniers jours
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Ventes complétées
                </div>
              </div>
              <Link
                to="/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-gold-500)',
                  textDecoration: 'none',
                }}
              >
                Rapports <ArrowUpRight size={13} />
              </Link>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8A830" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#E8A830" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="transparent"
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-body)' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="transparent"
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-body)' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(232,168,48,0.15)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#E8A830"
                    strokeWidth={2}
                    fill="url(#amberGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#E8A830', stroke: '#F0C050', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 22px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                Ventes Récentes
              </div>
              <Link to="/sales" style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600,
                color: 'var(--color-gold-500)', textDecoration: 'none',
              }}>
                Voir tout <ArrowUpRight size={13} />
              </Link>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.15)' }}>
                  {['Client', 'Produits', 'Type', 'Montant', 'Date'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 20px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.10em',
                      textAlign: i >= 3 ? 'right' : 'left',
                      borderBottom: '1px solid var(--color-border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.recentSales || []).slice(0, 6).map((sale) => (
                  <tr key={sale.id} style={{ cursor: 'default' }}>
                    <td style={{
                      padding: '12px 20px',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      {sale.customer?.name || (
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontStyle: 'italic' }}>
                          Client de passage
                        </span>
                      )}
                    </td>
                    <td style={{
                      padding: '12px 20px',
                      fontSize: 12.5,
                      color: 'var(--color-text-muted)',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      {sale.items.slice(0, 2).map(i => `${i.product.name} ×${i.quantity}`).join(', ')}
                      {sale.items.length > 2 && ` +${sale.items.length - 2}`}
                    </td>
                    <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
                      <span className={`badge ${sale.type === 'wholesale' ? 'badge-gold' : 'badge-info'}`}>
                        {sale.type === 'wholesale' ? 'Gros' : 'Détail'}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 20px',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--color-gold-400)',
                      textAlign: 'right',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      {fmt(sale.total)}
                    </td>
                    <td style={{
                      padding: '12px 20px',
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      textAlign: 'right',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      {fmtDate(sale.createdAt)}
                    </td>
                  </tr>
                ))}
                {(!stats?.recentSales || stats.recentSales.length === 0) && (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Aucune vente récente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Actions Rapides
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                to="/sales"
                className="btn btn-gold"
                style={{ justifyContent: 'center', borderRadius: 12, padding: '11px 18px' }}
              >
                <ShoppingCart size={15} /> Nouvelle Vente
              </Link>
              <Link
                to="/products"
                className="btn btn-outline"
                style={{ justifyContent: 'center', borderRadius: 12, padding: '10px 18px' }}
              >
                <Plus size={15} /> Ajouter un Produit
              </Link>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="card" style={{ padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Alertes de Stock
              </div>
              {lowStock.length > 0 && (
                <span className="badge badge-warning">{lowStock.length}</span>
              )}
            </div>

            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🍯</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Tous les stocks sont optimaux
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                {lowStock.map((p) => {
                  const pct = Math.max(0, Math.min(100, (p.currentStock / p.minStock) * 100))
                  const isEmpty = p.currentStock <= 0
                  return (
                    <div key={p.id} style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--color-bg)',
                      border: `1px solid ${isEmpty ? 'rgba(224,72,72,0.15)' : 'rgba(232,168,48,0.12)'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}>
                          {p.name}
                        </div>
                        <span className={`badge ${isEmpty ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                          {isEmpty ? 'Épuisé' : 'Faible'}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{
                        height: 3,
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: isEmpty
                            ? 'var(--color-danger)'
                            : 'linear-gradient(to right, #f8e08e 0%, #d1a054 25%, #b88632 50%, #d1a054 75%, #f8e08e 100%)',
                          borderRadius: 3,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 5 }}>
                        {p.currentStock} / {p.minStock} {p.unit}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}