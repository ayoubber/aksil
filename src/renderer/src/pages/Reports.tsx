import { useEffect, useState } from 'react'
import { Download, TrendingUp, DollarSign, Package } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface ReportData {
  totalRevenue: number; totalDiscount: number; salesCount: number
  retailCount: number; retailRevenue: number; wholesaleCount: number; wholesaleRevenue: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  topCustomers: Array<{ name: string; purchases: number; total: number }>
  sales: any[]
}
interface InventoryValuation {
  products: Array<{ name: string; type: string; stock: number; costValue: number; retailValue: number }>
  totalCost: number; totalRetail: number; potentialProfit: number
}

const PERIOD_LABELS: Record<string, string> = { week: '7 derniers jours', month: 'Ce mois', year: 'Cette année' }

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-surface-elevated)', border: '1px solid rgba(232,168,48,0.20)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.40)' }}>
      {label && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>}
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, fontWeight: 700, color: 'var(--color-gold-400)' }}>
        {new Intl.NumberFormat('fr-DZ').format(payload[0]?.value ?? 0)} DA
      </div>
    </div>
  )
}

export default function Reports() {
  const [period, setPeriod] = useState('month')
  const [report, setReport] = useState<ReportData | null>(null)
  const [valuation, setValuation] = useState<InventoryValuation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [period])

  const loadData = async () => {
    setLoading(true)
    const [repRes, valRes] = await Promise.all([
      window.api.getSalesReport(period), window.api.getInventoryValuation(),
    ])
    if (repRes.success) setReport(repRes.data as ReportData)
    if (valRes.success) setValuation(valRes.data as InventoryValuation)
    setLoading(false)
  }

  const exportCSV = () => {
    if (!report) return
    const csv = [
      ['Date', 'Client', 'Type', 'Montant', 'Remise'].join(','),
      ...report.sales.map(s => [
        new Date(s.createdAt).toLocaleDateString(),
        `"${s.customer?.name || 'Client de passage'}"`,
        s.type, s.total, s.discount,
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rapport_${period}.csv`
    a.click()
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'
  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n.toString()

  const pieData = report ? [
    { name: 'Détail', value: report.retailRevenue, color: '#4A9CF6' },
    { name: 'Gros', value: report.wholesaleRevenue, color: '#E8A830' },
  ] : []

  if (loading || !report || !valuation) {
    return (
      <div style={{ padding: 32 }}>
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="skeleton" style={{ height: 300 }} />
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: 4, lineHeight: 1 }}>Rapports</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{PERIOD_LABELS[period]}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Period toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg)', padding: '4px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
            {(['week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: period === p ? 'var(--color-surface-elevated)' : 'transparent', border: period === p ? '1px solid var(--color-border-light)' : '1px solid transparent', color: period === p ? 'var(--color-text)' : 'var(--color-text-muted)', transition: 'all 0.12s ease' }}>
                {p === 'week' ? '7j' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn btn-outline"><Download size={14} /> CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: "Chiffre d'Affaires", value: fmt(report.totalRevenue), sub: `${report.salesCount} ventes`, icon: DollarSign, accent: true },
          { label: 'Ventes Détail', value: fmt(report.retailRevenue), sub: `${report.retailCount} transactions`, icon: TrendingUp, accent: false },
          { label: 'Ventes Gros', value: fmt(report.wholesaleRevenue), sub: `${report.wholesaleCount} transactions`, icon: TrendingUp, accent: false },
          { label: 'Valeur du Stock', value: fmt(valuation.totalRetail), sub: `Marge: ${fmt(valuation.potentialProfit)}`, icon: Package, accent: false },
        ].map((card) => (
          <div key={card.label} className="card" style={{ padding: '18px 20px', border: card.accent ? '1px solid rgba(232,168,48,0.22)' : '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{card.label}</span>
              <card.icon size={15} style={{ color: card.accent ? 'var(--color-gold-500)' : 'var(--color-text-muted)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 800, color: card.accent ? 'var(--color-gold-400)' : 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 6 }}>{card.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Top products bar */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Top Produits par Revenus</div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginBottom: 18 }}>5 meilleurs produits</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.topProducts.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="transparent" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-body)' }} tickFormatter={fmtK} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="transparent" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontFamily: 'var(--font-body)' }} width={90} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#C88818" />
                      <stop offset="100%" stopColor="#F0C050" />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie + breakdown */}
        <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Répartition des Ventes</div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginBottom: 18 }}>Détail vs Gros</div>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 24 }}>
            <div style={{ height: 200, flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                  </Pie>
                  <RechartsTooltip formatter={(v: any) => fmt(v as number)} contentStyle={{ background: 'var(--color-surface-elevated)', border: '1px solid rgba(232,168,48,0.20)', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '0 0 150px' }}>
              {pieData.map(d => (
                <div key={d.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{d.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: 'var(--color-text-secondary)' }}>{fmt(d.value)}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {report.totalRevenue > 0 ? ((d.value / report.totalRevenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: top customers + inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Top customers */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
            Meilleurs Clients
          </div>
          {report.topCustomers.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}><p style={{ color: 'var(--color-text-muted)' }}>Aucune donnée</p></div>
          ) : (
            <div>
              {report.topCustomers.slice(0, 6).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < Math.min(report.topCustomers.length, 6) - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(232,168,48,0.10)', border: '1px solid rgba(232,168,48,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--color-gold-400)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.purchases} achat{c.purchases > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, fontWeight: 700, color: 'var(--color-gold-400)' }}>{fmt(c.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory valuation */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Valorisation du Stock</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>Marge potentielle</div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: 'var(--color-success)' }}>{fmt(valuation.potentialProfit)}</div>
            </div>
          </div>
          <div>
            {valuation.products.filter(p => p.stock > 0).slice(0, 6).map((p, i, arr) => {
              const maxVal = Math.max(...arr.map(x => x.retailValue))
              const pct = maxVal > 0 ? (p.retailValue / maxVal) * 100 : 0
              return (
                <div key={i} style={{ padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, fontWeight: 700, color: 'var(--color-gold-400)' }}>{fmt(p.retailValue)}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #C88818, #F0C050)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{p.stock} unités · Coût: {fmt(p.costValue)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}