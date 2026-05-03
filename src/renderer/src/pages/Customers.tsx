import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface Customer {
  id: number
  name: string
  type: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
  _count: { sales: number; invoices: number }
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const { showToast } = useToast()

  const [form, setForm] = useState({
    name: '',
    type: 'retail',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

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
    setForm({
      name: c.name,
      type: c.type,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || ''
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: form.name,
      type: form.type,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      notes: form.notes || null
    }

    const res = editing
      ? await window.api.updateCustomer(editing.id, data)
      : await window.api.createCustomer(data)

    if (res.success) {
      showToast(editing ? 'Client mis à jour' : 'Client créé', 'success')
      setModalOpen(false)
      loadCustomers()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    const res = await window.api.deleteCustomer(id)
    if (res.success) {
      showToast('Client supprimé', 'success')
      loadCustomers()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-text-secondary text-sm mt-1">{customers.length} clients</p>
        </div>
        <button onClick={openCreate} className="btn btn-gold">
          <Plus size={16} /> Nouveau Client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="input pl-10"
          placeholder="Rechercher par nom ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="h-64 skeleton rounded-xl" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="mb-3 text-text-muted" />
          <p className="text-lg font-medium mb-1">Aucun client trouvé</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container border-none">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Ventes</th>
                  <th>Factures</th>
                  <th>Ajouté le</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>
                      <span
                        className={`badge ${c.type === 'wholesale' ? 'badge-gold' : 'badge-info'}`}
                      >
                        {c.type === 'wholesale' ? 'Gros' : 'Détail'}
                      </span>
                    </td>
                    <td className="text-sm">
                      <div className="text-text-secondary">{c.phone || '—'}</div>
                      {c.email && <div className="text-xs text-text-muted">{c.email}</div>}
                    </td>
                    <td>
                      <span className="badge badge-success">{c._count.sales}</span>
                    </td>
                    <td>
                      <span className="badge badge-warning">{c._count.invoices}</span>
                    </td>
                    <td className="text-sm text-text-secondary">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right space-x-1">
                      <button onClick={() => openEdit(c)} className="btn btn-ghost p-1.5">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={c._count.sales > 0}
                        className="btn btn-ghost p-1.5 text-danger disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le client' : 'Nouveau Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Nom du client *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type *</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="retail">Détail</option>
                <option value="wholesale">Gros</option>
              </select>
            </div>
            <div>
              <label className="input-label">Téléphone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Adresse</label>
            <textarea
              className="input resize-none"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Notes</label>
            <textarea
              className="input resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-outline flex-1"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-gold flex-1">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
