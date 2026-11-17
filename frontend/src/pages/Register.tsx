import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaPhone, FaSpinner, FaUser } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import { AuthShell, Field, fieldInput } from '../components/auth'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const { register } = useAuth()
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await register(name.trim(), email.trim(), phone.trim(), password)
      toast('Account created — welcome aboard!', 'success')
      nav('/dashboard')
    } catch (err) { toast(errorMessage(err), 'error') }
    finally { setBusy(false) }
  }

  return (
    <div className="page-anim py-4">
      <AuthShell
        title="Create your account"
        subtitle="Join BananaTwin to grade, screen and track bananas."
        footer={<>Have an account? <Link to="/login" className="font-bold text-brand-600 hover:underline">Login</Link></>}
      >
        <form onSubmit={submit} className="space-y-3.5">
          <Field label="Full name" icon={<FaUser />}>
            <input className={fieldInput} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" autoComplete="name" />
          </Field>
          <Field label="Email address" icon={<FaEnvelope />}>
            <input className={fieldInput} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" />
          </Field>
          <Field label="Phone number" icon={<FaPhone />}>
            <input className={fieldInput} type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" autoComplete="tel" />
          </Field>
          <Field label="Password" icon={<FaLock />}>
            <input className={`${fieldInput} !pr-11`} type={show ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password (min 6 chars)" autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-brand-600 transition-all duration-200 hover:scale-110 hover:text-brand-600 dark:text-brand-300">
              {show ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
            </button>
          </Field>
          <button className="btn-primary flex w-full items-center justify-center gap-2 !py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/40" disabled={busy}>
            {busy && <FaSpinner className="animate-spin" />} {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </AuthShell>
    </div>
  )
}
