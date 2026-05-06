import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface Customer {
  id: number; name: string; type: string; phone: string | null; email: string | null
  address: string | null; notes: string | null; createdAt: string
  _count: { sales: number; invoices: number }
}

const S = {
  label: { display: 'block' as const, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'var(--color-text-muted)', marginBottom: 7 },
}

function Avatar({ name, type }: { name: string; type: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
      background: type === 'wholesale' ? 'rgba(232,168,48,0.12)' : 'rgba(74,156,246,0.12)',
      border: type === 'wholesale' ? '1px solid rgba(232,168,48,0.22)' : '1px solid rgba(74,156,246,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, letterSpacing: '0.02em',
      color: type === 'wholesale' ? 'var(--color-gold-400)' : 'var(--color-info)',
    }}>
      {initials}
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'retail' | 'wholesale'>('all')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const { showToast } = useToast()

  const [form, setForm] = useState({ name: '', type: 'retail', phone: '', email: '', address: '', notes: '' })

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    setLoading(true)
    const res = await window.api.getCustomers()
    if (res.success) setCustomers(res.data as Customer[])
    setLoading(false)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', type: 'retail', phone: '', email: '', address: '', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({ name: c.name, type: c.type, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name: form.name, type: form.type, phone: form.phone || null, email: form.email || null, address: form.address || null, notes: form.notes || null }
    const res = editing ? await window.api.updateCustomer(editing.id, data) : await window.api.createCustomer(data)
    if (res.success) {
      showToast(editing ? 'Client mis à jour' : 'Client créé', 'success')
      setModalOpen(false); loadCustomers()
    } else { showToast(res.error || 'Erreur', 'error') }
  }

  const handleDelete = async (id: number) => {
    const res = await window.api.deleteCustomer(id)
    if (res.success) { showToast('Client supprimé', 'success'); loadCustomers() }
    else showToast(res.error || 'Erreur', 'error')
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
    const matchFilter = filter === 'all' || c.type === filter
    return matchSearch && matchFilter
  })

  const wholesaleCount = customers.filter(c => c.type === 'wholesale').length
  const retailCount = customers.filter(c => c.type === 'retail').length

  return (
    <div style={{ padding: '32px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: 4, lineHeight: 1 }}>
            Clients
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {customers.length} clients · {wholesaleCount} grossistes · {retailCount} détail
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-gold">
          <Plus size={15} /> Nouveau Client
        </button>
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 0 320px' }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg)', padding: '4px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
          {(['all', 'retail', 'wholesale'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === f ? 'var(--color-surface-elevated)' : 'transparent',
              border: filter === f ? '1px solid var(--color-border-light)' : '1px solid transparent',
              color: filter === f ? 'var(--color-text)' : 'var(--color-text-muted)',
              transition: 'all 0.12s ease',
            }}>
              {f === 'all' ? 'Tous' : f === 'retail' ? 'Détail' : 'Gros'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="skeleton" style={{ height: 400 }} />
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div style={{ fontSize: 36, marginBottom: 12 }}>👥</div><p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Aucun client</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.20)' }}>
                {['Client', 'Type', 'Contact', 'Ventes', 'Factures', 'Depuis', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 18px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,168,48,0.025)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar name={c.name} type={c.type} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', marginBottom: 1 }}>{c.name}</div>
                        {c.address && <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{c.address.slice(0, 30)}{c.address.length > 30 ? '…' : ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <span className={`badge ${c.type === 'wholesale' ? 'badge-gold' : 'badge-info'}`}>
                      {c.type === 'wholesale' ? 'Grossiste' : 'Détail'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--color-text-secondary)' }}><Phone size={11} style={{ color: 'var(--color-text-muted)' }} />{c.phone}</div>}
                      {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--color-text-muted)' }}><Mail size={10} />{c.email}</div>}
                      {!c.phone && !c.email && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(46,170,112,0.10)', border: '1px solid rgba(46,170,112,0.15)', fontSize: 12, fontWeight: 800, color: 'var(--color-success)' }}>
                      {c._count.sales}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(232,168,48,0.10)', border: '1px solid rgba(232,168,48,0.15)', fontSize: 12, fontWeight: 800, color: 'var(--color-gold-400)' }}>
                      {c._count.invoices}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: 12, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(c)} className="btn btn-ghost btn-sm" style={{ padding: '5px 7px' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(c.id)} disabled={c._count.sales > 0} className="btn btn-ghost btn-sm" style={{ padding: '5px 7px', color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => { if (c._count.sales === 0) e.currentTarget.style.color = 'var(--color-danger)' }}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le client' : 'Nouveau Client'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label style={S.label}>Nom du client *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Type *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['retail', 'wholesale'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: form.type === t ? 'rgba(232,168,48,0.10)' : 'transparent', border: form.type === t ? '1px solid rgba(232,168,48,0.28)' : '1px solid var(--color-border)', color: form.type === t ? 'var(--color-gold-400)' : 'var(--color-text-muted)', transition: 'all 0.12s ease' }}>
                    {t === 'retail' ? 'Détail' : 'Gros'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Téléphone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0555 00 00 00" />
            </div>
          </div>
          <div>
            <label style={S.label}>Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label style={S.label}>Adresse</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label style={S.label}>Notes</label>
            <textarea className="input" style={{ height: 64, resize: 'none' }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
            <button type="submit" className="btn btn-gold" style={{ flex: 1 }}>{editing ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}