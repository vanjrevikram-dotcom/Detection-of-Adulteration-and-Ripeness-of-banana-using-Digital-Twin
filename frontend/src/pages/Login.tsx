import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaSpinner } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import { AuthShell, Field, fieldInput } from '../components/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await login(email.trim(), password)
      toast('Welcome back!', 'success')
      nav('/dashboard')
    } catch (err) { toast(errorMessage(err), 'error') }
    finally { setBusy(false) }
  }

  return (
    <div className="page-anim py-4">
      <AuthShell
        title="Welcome back"
        subtitle="Login to continue to your Digital Twins."
        footer={<>No account yet? <Link to="/register" className="font-bold text-brand-600 hover:underline">Register</Link></>}
      >
        <form onSubmit={submit} className="space-y-3.5">
          <Field label="Email address" icon={<FaEnvelope />}>
            <input className={fieldInput} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" />
          </Field>
          <Field label="Password" icon={<FaLock />}>
            <input className={`${fieldInput} !pr-11`} type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-brand-600 transition-all duration-200 hover:scale-110 hover:text-brand-600 dark:text-brand-300">
              {show ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
            </button>
          </Field>
          <button className="btn-primary flex w-full items-center justify-center gap-2 !py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/40" disabled={busy}>
            {busy && <FaSpinner className="animate-spin" />} {busy ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </AuthShell>
    </div>
  )
}
