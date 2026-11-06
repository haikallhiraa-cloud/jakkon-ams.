import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
export default function App() {
  const { session, profile, loading, signOut } = useAuth()
  if (loading) return <div className="p-10 text-mute">Memuat...</div>
  if (!session) return <Login />
  if (!profile) return (
    <div className="min-h-screen grid place-items-center p-6"><div className="card max-w-md text-center">
      <h1 className="font-bold text-lg mb-2">Akun belum aktif</h1>
      <p className="text-mute mb-4">Akun Anda belum terdaftar atau dinonaktifkan. Hubungi administrator JAKKON.</p>
      <button className="btn2" onClick={signOut}>Keluar</button></div></div>)
  return (
    <Routes><Route element={<Layout />}>
      <Route index element={<Dashboard />} /><Route path="assets" element={<Assets />} />
      <Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>)
}
