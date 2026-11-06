import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Boxes, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../auth'
const ROLE = { admin: 'Administrator', staff: 'Staff', viewer: 'Viewer' }
export default function Layout() {
  const [open, setOpen] = useState(false)
  const { profile, role, signOut } = useAuth()
  const item = ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold mb-1 ${isActive ? 'bg-navy text-white' : 'text-mute hover:bg-soft'}`
  return (
    <div className="min-h-screen">
      <aside className={`fixed inset-y-0 left-0 w-60 bg-white border-r border-line p-4 z-30 flex flex-col transition-transform ${open ? '' : '-translate-x-full'} md:translate-x-0`}>
        <img src="/logo-jakkon.png" alt="JAKKON" className="w-40 mx-2 mt-1 mb-6" />
        <nav onClick={() => setOpen(false)} className="flex-1">
          <NavLink to="/" end className={item}><LayoutDashboard size={18} />Dashboard</NavLink>
          <NavLink to="/assets" className={item}><Boxes size={18} />Semua Aset</NavLink>
        </nav>
        <div className="border-t border-line pt-3">
          <div className="px-2 text-sm font-semibold truncate">{profile.full_name || 'Pengguna'}</div>
          <div className="px-2 text-xs text-mute mb-2">{ROLE[role]}</div>
          <button onClick={signOut} className="btn2 w-full flex items-center justify-center gap-2"><LogOut size={16} />Keluar</button>
        </div>
      </aside>
      <main className="md:ml-60 p-4 md:p-6">
        <button className="md:hidden btn2 mb-3" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={18} /></button>
        <Outlet />
      </main>
    </div>)
}
