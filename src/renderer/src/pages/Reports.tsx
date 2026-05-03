import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Download, TrendingUp, DollarSign, Package } from 'lucide-react'

interface ReportData {
  totalRevenue: number
  totalDiscount: number
  salesCount: number
  retailCount: number
  retailRevenue: number
  wholesaleCount: number
  wholesaleRevenue: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  topCustomers: Array<{ name: string; purchases: number; total: number }>
  sales: any[]
}

interface InventoryValuation {
  products: Array<{
    name: string
    type: string
    stock: number
    costValue: number
    retailValue: number
  }>
  totalCost: number
  totalRetail: number
  potentialProfit: number
}



export default function Reports() {
  const [period, setPeriod] = useState('month')
  const [report, setReport] = useState<ReportData | null>(null)
  const [valuation, setValuation] = useState<InventoryValuation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    const [repRes, valRes] = await Promise.all([
      window.api.getSalesReport(period),
      window.api.getInventoryValuation()
    ])
    if (repRes.success) setReport(repRes.data as ReportData)
    if (valRes.success) setValuation(valRes.data as InventoryValuation)
    setLoading(false)
  }

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'

  const pieData = report
    ? [
        { name: 'Détail', value: report.retailRevenue },
        { name: 'Gros', value: report.wholesaleRevenue }
      ]
    : []

  const exportCSV = () => {
    if (!report) return
    const csvContent = [
      ['Date', 'Client', 'Type', 'Montant', 'Remise'].join(','),
      ...report.sales.map((s) =>
        [
          new Date(s.createdAt).toLocaleDateString(),
          `"${s.customer?.name || 'Client de passage'}"`,
          s.type,
          s.total,
          s.discount
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapport_ventes_${period}.csv`
    link.click()
  }

  if (loading || !report || !valuation) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 skeleton rounded-xl" />
          <div className="h-80 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rapports & Analyses</h1>
          <p className="text-text-secondary text-sm mt-1">Performances et valorisation</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-40" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button onClick={exportCSV} className="btn btn-outline">
            <Download size={16} /> Exporter CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-text-secondary text-sm">Chiffre d'Affaires</span>
            <DollarSign size={18} className="text-gold" />
          </div>
          <p className="text-2xl font-bold">{formatPrice(report.totalRevenue)}</p>
          <p className="text-xs text-text-muted mt-1">{report.salesCount} ventes au total</p>
        </div>
        <div className="card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-text-secondary text-sm">Ventes Détail</span>
            <TrendingUp size={18} className="text-info" />
          </div>
          <p className="text-2xl font-bold">{formatPrice(report.retailRevenue)}</p>
          <p className="text-xs text-text-muted mt-1">{report.retailCount} transactions</p>
        </div>
        <div className="card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-text-secondary text-sm">Ventes Gros</span>
            <TrendingUp size={18} className="text-success" />
          </div>
          <p className="text-2xl font-bold">{formatPrice(report.wholesaleRevenue)}</p>
          <p className="text-xs text-text-muted mt-1">{report.wholesaleCount} transactions</p>
        </div>
        <div className="card-gold p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-text-secondary text-sm">Valeur du Stock (Revente)</span>
            <Package size={18} className="text-gold" />
          </div>
          <p className="text-2xl font-bold text-gold">{formatPrice(valuation.totalRetail)}</p>
          <p className="text-xs text-text-muted mt-1">
            Marge estimée: {formatPrice(valuation.potentialProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Top 5 Produits (Revenus)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report.topProducts.slice(0, 5)}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#666"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis dataKey="name" type="category" stroke="#ccc" fontSize={11} width={100} />
                <RechartsTooltip
                  cursor={{ fill: '#222' }}
                  contentStyle={{
                    background: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="#D1AA56" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="card p-5 flex flex-col">
          <h3 className="font-semibold mb-4">Répartition des Ventes</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#60A5FA' : '#D1AA56'} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any) => formatPrice(value as number)}
                    contentStyle={{ background: '#1A1A1A', border: 'none', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-4 ml-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#60A5FA]" />
                <div>
                  <p className="text-sm font-medium">Détail</p>
                  <p className="text-xs text-text-muted">{formatPrice(report.retailRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#D1AA56]" />
                <div>
                  <p className="text-sm font-medium">Gros</p>
                  <p className="text-xs text-text-muted">{formatPrice(report.wholesaleRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
