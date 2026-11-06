import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth'
const COND = ['Baik', 'Cukup', 'Rusak Ringan', 'Rusak Berat'], PS = 10
const BADGE = { Tersedia: 'bg-green-50 text-ok', 'Dalam Perawatan': 'bg-amber-50 text-amber-700', Rusak: 'bg-red-50 text-bad' }
export default function Assets() {
  const { canWrite, isAdmin } = useAuth()
  const [rows, setRows] = useState([]), [ref, setRef] = useState({ cats: [], types: [], locs: [], deps: [] })
  const [q, setQ] = useState(''), [cat, setCat] = useState(''), [page, setPage] = useState(1)
  const [modal, setModal] = useState(null), [msg, setMsg] = useState(null)
  const flash = (t, e) => { setMsg({ t, e }); setTimeout(() => setMsg(null), 4000) }
  async function load() {
    const [a, c, t, l, d] = await Promise.all([
      supabase.from('assets').select('*,asset_types(name,categories(name)),locations(name),departments(name)').is('deleted_at', null).order('code'),
      supabase.from('categories').select('*').order('name'), supabase.from('asset_types').select('*').order('name'),
      supabase.from('locations').select('*').order('name'), supabase.from('departments').select('*').order('name')])
    if (a.error) return flash('Gagal memuat aset: ' + a.error.message, true)
    setRows(a.data); setRef({ cats: c.data || [], types: t.data || [], locs: l.data || [], deps: d.data || [] })
  }
  useEffect(() => { load() }, [])
  const list = useMemo(() => rows.filter(a => (!cat || String(a.category_id) === cat) &&
    (a.code + a.name + (a.brand || '') + (a.model || '')).toLowerCase().includes(q.toLowerCase())), [rows, q, cat])
  const pages = Math.max(1, Math.ceil(list.length / PS)), view = list.slice((page - 1) * PS, page * PS)
  async function del(a) {
    if (!window.confirm(`Hapus aset "${a.name}"? Riwayatnya tetap tersimpan.`)) return
    const { error } = await supabase.from('assets').update({ deleted_at: new Date().toISOString() }).eq('id', a.id)
    error ? flash('Gagal menghapus: ' + error.message, true) : (flash('Aset dihapus'), load())
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]"><Search size={16} className="absolute left-3 top-3 text-mute" />
          <input className="inp pl-9" placeholder="Cari kode, nama, merek..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }} /></div>
        <select className="inp w-auto" value={cat} onChange={e => { setCat(e.target.value); setPage(1) }}>
          <option value="">Semua kategori</option>{ref.cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        {canWrite && <button className="btn flex items-center gap-2" onClick={() => setModal({ type: 'add' })}><Plus size={16} />Tambah Aset</button>}
      </div>
      {msg && <div className={`mb-3 px-4 py-2 rounded-xl text-white font-semibold ${msg.e ? 'bg-bad' : 'bg-ok'}`}>{msg.t}</div>}
      <div className="card p-0 overflow-x-auto"><table className="w-full text-sm">
        <thead><tr>{['Kode', 'Nama Barang', 'Kategori', 'Jenis', 'Merek', 'Total', 'Tersedia', 'Lokasi', 'Kondisi', 'Status', 'Aksi'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{view.map(a => <tr key={a.id}>
          <td className="td">{a.code}</td><td className="td font-semibold">{a.name}</td><td className="td">{a.asset_types?.categories?.name}</td><td className="td">{a.asset_types?.name}</td>
          <td className="td">{a.brand}</td><td className="td">{a.qty_total} {a.unit}</td><td className="td">{a.qty_available}</td><td className="td">{a.locations?.name}</td>
          <td className="td">{a.condition}</td><td className="td"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE[a.status]}`}>{a.status}</span></td>
          <td className="td space-x-2">{canWrite && <button className="btn2 !py-1 !px-3 text-xs" onClick={() => setModal({ type: 'stock', a })}>Stok</button>}
            {isAdmin && <button className="btn2 !py-1 !px-3 text-xs !text-bad" onClick={() => del(a)}>Hapus</button>}</td></tr>)}
          {!view.length && <tr><td className="td text-mute" colSpan={11}>Belum ada aset yang cocok.</td></tr>}</tbody></table></div>
      <div className="flex justify-end items-center gap-2 mt-3 text-sm text-mute">{list.length} aset · Halaman {page}/{pages}
        <button className="btn2 !py-1" disabled={page < 2} onClick={() => setPage(page - 1)}>Sebelumnya</button>
        <button className="btn2 !py-1" disabled={page >= pages} onClick={() => setPage(page + 1)}>Berikutnya</button></div>
      {modal && <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50"><div className="bg-white rounded-2xl p-5 w-full max-w-xl max-h-[92vh] overflow-auto">
        <button className="float-right" onClick={() => setModal(null)} aria-label="Tutup"><X size={18} /></button>
        {modal.type === 'add' ? <AddForm ref_={ref} done={m => { setModal(null); flash(m); load() }} /> : <StockForm a={modal.a} done={m => { setModal(null); flash(m); load() }} />}
      </div></div>}
    </div>)
}
function AddForm({ ref_, done }) {
  const [f, setF] = useState({ name: '', category_id: '', type_id: '', brand: '', model: '', qty: 1, unit: 'Unit', location_id: '', department_id: '', condition: 'Baik', date: '', responsible: '', value: 0 })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value, ...(k === 'category_id' ? { type_id: '' } : {}) })
  async function submit(e) {
    e.preventDefault(); setErr('')
    const qty = Number(f.qty)
    if (!f.name.trim() || !f.type_id) return setErr('Nama barang, kategori, dan jenis wajib diisi.')
    if (!Number.isInteger(qty) || qty < 0) return setErr('Quantity harus bilangan bulat, tidak boleh negatif.')
    setBusy(true)
    const { error } = await supabase.from('assets').insert({ name: f.name.trim(), category_id: +f.category_id, type_id: +f.type_id, brand: f.brand, model: f.model, qty_total: qty, unit: f.unit || 'Unit',
      location_id: +f.location_id || null, department_id: +f.department_id || null, condition: f.condition, procurement_date: f.date || null, responsible: f.responsible, acquisition_value: +f.value || 0 })
    setBusy(false)
    error ? setErr('Gagal menyimpan: ' + error.message) : done('Aset berhasil ditambahkan')
  }
  const Sel = ({ k, label, opts }) => <label className="text-xs font-bold text-mute">{label}<select className="inp font-normal text-ink" value={f[k]} onChange={set(k)}><option value="">Pilih...</option>{opts.map(o => <option key={o.id || o} value={o.id || o}>{o.name || o}</option>)}</select></label>
  const Inp = ({ k, label, type = 'text' }) => <label className="text-xs font-bold text-mute">{label}<input className="inp font-normal text-ink" type={type} value={f[k]} onChange={set(k)} /></label>
  return (
    <form onSubmit={submit}><h2 className="font-bold text-lg mb-3">Tambah Aset</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Inp k="name" label="Nama barang *" /></div>
        <Sel k="category_id" label="Kategori *" opts={ref_.cats} /><Sel k="type_id" label="Jenis *" opts={ref_.types.filter(t => String(t.category_id) === f.category_id)} />
        <Inp k="brand" label="Merek" /><Inp k="model" label="Model / spesifikasi" /><Inp k="qty" label="Quantity awal *" type="number" /><Inp k="unit" label="Satuan" />
        <Sel k="location_id" label="Lokasi" opts={ref_.locs} /><Sel k="department_id" label="Departemen" opts={ref_.deps} />
        <Sel k="condition" label="Kondisi" opts={COND} /><Inp k="date" label="Tanggal pengadaan" type="date" /><Inp k="responsible" label="Penanggung jawab" /><Inp k="value" label="Nilai perolehan (Rp)" type="number" /></div>
      {err && <div className="text-bad text-sm mt-3">{err}</div>}
      <div className="flex justify-end mt-4"><button className="btn" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button></div></form>)
}
function StockForm({ a, done }) {
  const [type, setType] = useState('Tambah'), [amount, setAmount] = useState(1), [reason, setReason] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setErr('')
    const n = Number(amount)
    if (!Number.isInteger(n) || n < 0) return setErr('Jumlah harus bilangan bulat valid.')
    if (!reason.trim()) return setErr('Alasan perubahan wajib diisi.')
    setBusy(true)
    const { error } = await supabase.rpc('apply_stock_movement', { p_asset: a.id, p_type: type, p_amount: n, p_reason: reason })
    setBusy(false)
    error ? setErr(error.message) : done('Stok berhasil diperbarui')
  }
  return (
    <form onSubmit={submit}><h2 className="font-bold text-lg">Ubah Stok</h2>
      <p className="text-sm text-mute mb-3">{a.name} · total saat ini {a.qty_total} {a.unit}, digunakan {a.qty_in_use}</p>
      <label className="text-xs font-bold text-mute">Jenis perubahan<select className="inp font-normal text-ink mb-3" value={type} onChange={e => setType(e.target.value)}><option>Tambah</option><option>Kurang</option><option>Koreksi</option></select></label>
      <label className="text-xs font-bold text-mute">{type === 'Koreksi' ? 'Jumlah stok yang benar' : 'Jumlah'}<input className="inp font-normal text-ink mb-3" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label className="text-xs font-bold text-mute">Alasan *<textarea className="inp font-normal text-ink" rows={2} value={reason} onChange={e => setReason(e.target.value)} /></label>
      {err && <div className="text-bad text-sm mt-3">{err}</div>}
      <div className="flex justify-end mt-4"><button className="btn" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button></div></form>)
}
