import { useState } from 'react'
import { useAuth } from '../auth'
export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await signIn(email.trim(), password)
    if (error) setErr('Email atau password salah.')
    setBusy(false)
  }
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <img src="/logo-jakkon.png" alt="JAKKON" className="w-44 mx-auto mb-4" />
        <h1 className="text-center font-extrabold text-lg">Asset Management System</h1>
        <p className="text-center text-mute text-sm mb-5">Masuk dengan akun yang diberikan administrator.</p>
        <label className="text-xs font-bold text-mute">Email</label>
        <input className="inp mb-3" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label className="text-xs font-bold text-mute">Password</label>
        <input className="inp mb-3" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        {err && <div className="text-bad text-sm mb-3">{err}</div>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Memproses...' : 'Masuk'}</button>
      </form>
    </div>)
}
