import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'
import PasswordInput from '../components/PasswordInput'

export default function Profile() {
  const { user, logout, refresh } = useAuth()
  const nav = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [changing, setChanging] = useState(false)

  useEffect(() => { api.get('/api/auth/stats').then((r) => setStats(r.data)).catch(() => {}) }, [])
  useEffect(() => { setName(user?.name ?? ''); setPhone(user?.phone ?? '') }, [user])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/api/auth/profile', { name: name.trim(), phone: phone.trim() || undefined })
      await refresh()
      toast('Profile updated', 'success')
    } catch (err) { toast(errorMessage(err), 'error') }
    finally { setSaving(false) }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw.length < 6) { toast('New password must be at least 6 characters.', 'error'); return }
    setChanging(true)
    try {
      await api.put('/api/auth/password', { current_password: currentPw, new_password: newPw })
      setCurrentPw(''); setNewPw('')
      toast('Password changed successfully', 'success')
    } catch (err) { toast(errorMessage(err), 'error') }
    finally { setChanging(false) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card page-anim">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-black dark:text-white">{user?.email} · joined {user?.created_at?.slice(0, 10)}</p>
        <form onSubmit={save} className="mt-4 space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" required />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" />
          </div>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
      </div>

      <div className="card page-anim page-anim-1">
        <h2 className="font-bold">Change password</h2>
        <p className="text-sm text-black dark:text-white">Enter your current password to set a new one.</p>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <PasswordInput label="Current password" value={currentPw} onChange={setCurrentPw} placeholder="Enter your current password" required autoComplete="current-password" />
          <PasswordInput label="New password (min 6 chars)" value={newPw} onChange={setNewPw} placeholder="Enter your new password" minLength={6} required autoComplete="new-password" />
          <button className="btn-ghost" disabled={changing}>{changing ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>

      <div className="card page-anim page-anim-2">
        <h2 className="font-bold">Account statistics</h2>
        <p className="text-sm">Digital Twins: <b>{stats?.twins ?? '—'}</b> · Analyses: <b>{stats?.analyses ?? '—'}</b></p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/predictions" className="btn-ghost text-sm">My Predictions →</Link>
          <Link to="/twins" className="btn-ghost text-sm">My Digital Twins →</Link>
          <button onClick={() => { logout(); nav('/') }} className="btn-ghost text-sm">Logout</button>
        </div>
      </div>
    </div>
  )
}
