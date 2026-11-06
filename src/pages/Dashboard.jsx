import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { supabase } from '../lib/supabase'
const COLORS = ['#0B3B6F', '#145A9C', '#3B82C4', '#7DB2E3', '#BBD7F2']
const ACT = { INSERT: 'Ditambahkan', UPDATE: 'Diubah', DELETE: 'Dihapus' }
export default function Dashboard() {
  const [rows, setRows] = useState(null), [logs, setLogs] = useState([]), [err, setErr] = useState('')
  useEffect(() => { (async () => {
    const a = await supabase.from('assets').select('id,code,name,qty_total,qty_in_use,qty_available,status,condition,needs_qc,asset_types(categories(name))').is('deleted_at', null)
    if (a.error) return setErr(a.error.message)
    setRows(a.data)
    const l = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6)
    setLogs(l.data || [])
  })() }, [])
  if (err) return <div className="card text-bad">Gagal memuat data: {err}</div>
  if (!rows) return <div className="text-mute">Memuat...</div>
  const sum = f => rows.reduce((s, a) => s + f(a), 0)
  const kpi = [['Total Aset', sum(a => a.qty_total)], ['Aset Tersedia', sum(a => a.qty_available)], ['Digunakan', sum(a => a.qty_in_use)],
    ['Dalam Perawatan', sum(a => a.status === 'Dalam Perawatan' ? a.qty_total : 0)], ['Aset Rusak', sum(a => a.status === 'Rusak' ? a.qty_total : 0)], ['Perlu Quality Check', rows.filter(a => a.needs_qc).length]]
  const byCat = Object.entries(rows.reduce((o, a) => { const c = a.asset_types?.categories?.name || '-'; o[c] = (o[c] || 0) + a.qty_total; return o }, {})).map(([name, value]) => ({ name, value }))
  const byCond = Object.entries(rows.reduce((o, a) => { o[a.condition] = (o[a.condition] || 0) + 1; return o }, {})).map(([name, value]) => ({ name, value }))
  const attention = rows.filter(a => a.needs_qc || a.status !== 'Tersedia' || a.condition.startsWith('Rusak'))
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-navy to-brand text-white p-6">
        <h1 className="text-2xl font-extrabold">Selamat Datang di JAKKON Asset Management</h1>
        <p className="opacity-90">Kelola aset perusahaan dengan lebih mudah, terstruktur, dan transparan.</p></div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {kpi.map(([l, v]) => <div key={l} className="card"><div className="text-sm text-mute font-semibold">{l}</div><div className="text-2xl font-extrabold">{v.toLocaleString('id-ID')}</div></div>)}</div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card"><h2 className="font-bold mb-2">Distribusi per Kategori</h2>
          {byCat.length ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>{byCat.map((_, i) => <Cell key={i} fill={COLORS[i % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <Empty />}</div>
        <div className="card"><h2 className="font-bold mb-2">Status Kondisi Aset</h2>
          {byCond.length ? <ResponsiveContainer width="100%" height={220}><BarChart data={byCond}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="value" fill="#145A9C" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <Empty />}</div>
        <div className="card"><h2 className="font-bold mb-2">Aktivitas Terbaru</h2>
          {logs.length ? logs.map(l => <div key={l.id} className="py-2 border-b border-line text-sm"><b>{ACT[l.action]} {l.entity.replace('_', ' ')}</b><div className="text-mute text-xs">{l.detail?.name || l.detail?.code || ''} · {new Date(l.created_at).toLocaleString('id-ID')}</div></div>) : <Empty />}</div>
      </div>
      <div className="card overflow-x-auto"><h2 className="font-bold mb-2">Aset yang Membutuhkan Perhatian</h2>
        <table className="w-full text-sm"><thead><tr><th className="th">Kode</th><th className="th">Nama</th><th className="th">Status</th><th className="th">Catatan</th></tr></thead>
          <tbody>{attention.map(a => <tr key={a.id}><td className="td">{a.code}</td><td className="td">{a.name}</td><td className="td">{a.status}</td><td className="td">{a.needs_qc ? 'Perlu Quality Check' : a.condition}</td></tr>)}
            {!attention.length && <tr><td className="td text-mute" colSpan={4}>Tidak ada aset yang perlu perhatian.</td></tr>}</tbody></table>
        <Link to="/assets" className="text-brand font-semibold text-sm inline-block mt-3">Lihat semua aset →</Link></div>
    </div>)
}
const Empty = () => <p className="text-mute text-sm">Belum ada data. Tambahkan aset di menu Semua Aset.</p>
