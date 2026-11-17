import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{ twins: number; analyses: number; predictions: number } | null>(null)
  const [twins, setTwins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([api.get('/api/auth/stats'), api.get('/api/twins')])
        setStats(s.data); setTwins(t.data)
      } catch (err) { toast(errorMessage(err), 'error') }
      finally { setLoading(false) }
    })()
  }, [])

  const createTwin = async () => {
    const name = prompt('Name for the new Digital Twin:', 'My Banana')
    if (!name) return
    try {
      const { data } = await api.post('/api/twins', { name })
      setTwins((t) => [data, ...t])
      toast(`Twin ${data.twin_id} created`, 'success')
    } catch (err) { toast(errorMessage(err), 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold">Welcome, {user?.name} 👋</h1>
        <p className="text-sm text-black dark:text-white">Run analyses, track Digital Twins and forecast future ripeness stages.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/predict/ripeness" className="btn-primary text-sm">Ripeness Analysis</Link>
          <Link to="/predict/adulteration" className="btn-primary text-sm">Adulteration Analysis</Link>
          <Link to="/predict/combined" className="btn-primary text-sm">Combined Analysis</Link>
          <button onClick={createTwin} className="btn-ghost text-sm">+ Create Digital Twin</button>
        </div>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[['Digital Twins', stats?.twins ?? 0], ['Analyses', stats?.analyses ?? 0], ['Predictions', stats?.predictions ?? 0]].map(([t, v]) => (
            <div key={t as string} className="card text-center"><p className="text-3xl font-extrabold text-brand-500">{v}</p><p className="text-sm text-black dark:text-white">{t}</p></div>
          ))}
        </div>
      )}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Current Banana States</h2>
          <Link to="/twins" className="text-sm font-semibold text-brand-600">View all →</Link>
        </div>
        {twins.length === 0 ? <p className="text-sm text-black dark:text-white">No Digital Twins yet — create one to start tracking.</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {twins.slice(0, 4).map((t) => (
              <Link key={t.twin_id} to={`/twins/${t.twin_id}`} className="rounded-xl border border-brand-500/25 p-3 transition hover:border-brand-500 dark:border-brand-500/30">
                <p className="font-bold">{t.name} <span className="text-xs font-mono text-brand-600">{t.twin_id}</span></p>
                <p className="text-sm text-black dark:text-white">Stage: {t.current_stage ?? '—'} · Ripe: {t.ripeness_percentage ?? '—'}% · {t.adulteration_status ?? '—'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
