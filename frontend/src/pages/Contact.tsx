import { useState } from 'react'
import { FaClock, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'
import { toast } from '../components/Toast'
import Reveal from '../components/Reveal'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('General question')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const formData = new FormData()
      formData.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY ?? '')
      formData.append('subject', `[BananaTwin] ${topic} — ${name}`)
      formData.append('name', name)
      formData.append('email', email)
      formData.append('topic', topic)
      formData.append('message', message)
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        setSent(true)
        setName(''); setEmail(''); setTopic('General question'); setMessage('')
        toast('Message sent successfully!', 'success')
      } else {
        toast('Could not send the message. Please try again.', 'error')
      }
    } catch {
      toast('Network error. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="card page-anim">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Contact</p>
        <h1 className="mt-1 text-3xl font-extrabold">Talk to the BananaTwin Team</h1>
        <p className="mt-3 max-w-3xl text-black dark:text-white">
          Questions about ripeness grading, adulteration screening, pilot deployments,
          or the research behind the models — send a message and we’ll get back to you.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Reveal className="lg:col-span-3">
          <div className="card h-full">
            <h2 className="font-bold">Send a message</h2>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Name</label>
                  <input className="input transition-shadow focus:shadow-md focus:shadow-brand-500/20" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input transition-shadow focus:shadow-md focus:shadow-brand-500/20" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                </div>
              </div>
              <div>
                <label className="label">Topic</label>
                <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {['General question', 'Pilot deployment', 'Ripeness grading', 'Adulteration screening', 'Research collaboration', 'Bug report'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Message</label>
                <textarea className="input min-h-28 transition-shadow focus:shadow-md focus:shadow-brand-500/20" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your bananas, volumes, or questions…" />
              </div>
              <button disabled={sending} className="btn-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/40">
                {sending ? 'Sending…' : sent ? 'Message sent ✓ Send another' : 'Send message →'}
              </button>
            </form>
          </div>
        </Reveal>
        <div className="flex flex-col gap-4 lg:col-span-2">
          {[
            [FaEnvelope, 'Email', 'vineetya2004@gmail.com', 'Replies within 2 business days.', true],
            [FaClock, 'Response time', 'Mon – Fri', 'Pilot and research queries prioritized.', false],
            [FaMapMarkerAlt, 'Built for', 'Farm · Packhouse · Retail · Lab', 'Local-first deployment, your data stays yours.', false]
          ].map(([Icon, t, v, d, isEmail]: any, i) => (
            <Reveal key={t} delay={i * 90} className="h-full">
              <div className="card card-hover group flex h-full flex-col">
                <span className="icon-badge"><Icon size={20} /></span>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-600">{t}</p>
                {isEmail ? (
                  <a href={`mailto:${v}`} className="mt-1 break-all text-lg font-extrabold hover:text-brand-600 hover:underline">{v}</a>
                ) : (
                  <p className="mt-1 text-lg font-extrabold leading-snug">{v}</p>
                )}
                <p className="mt-1 text-sm text-black dark:text-white">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}
