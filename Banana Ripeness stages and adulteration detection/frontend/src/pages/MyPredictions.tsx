import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHistory } from 'react-icons/fa'
import { api, errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import Reveal from '../components/Reveal'

const typeColor: Record<string, string> = {
  ripeness: 'text-brand-600',
  adulteration: 'text-green-500',
  combined: 'text-brand-500'
}

export default function MyPredictions() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/predict')
      .then((r) => setItems(r.data))
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="icon-badge"><FaHistory size={20} /></span>
        <div>
          <h1 className="text-2xl font-bold">My Predictions</h1>
          <p className="text-sm text-black dark:text-white">Every analysis you ran, newest first — each one saved to its Digital Twin.</p>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : items.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm text-black dark:text-white">No predictions yet.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Link to="/predict/ripeness" className="btn-primary text-sm">Ripeness</Link>
            <Link to="/predict/adulteration" className="btn-primary text-sm">Adulteration</Link>
            <Link to="/predict/combined" className="btn-primary text-sm">Combined</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 5) * 50}>
              <div className="card card-hover flex flex-wrap items-center gap-3">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${typeColor[p.prediction_type] ?? ''} bg-brand-500/10`}>
                  {p.prediction_type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.prediction_value}</p>
                  <p className="text-xs text-black dark:text-white">
                    Confidence {p.confidence != null ? `${(p.confidence * 100).toFixed(1)}%` : '—'}
                    {' · '}{p.created_at?.slice(0, 16).replace('T', ' ') ?? ''}
                  </p>
                </div>
                {p.twin_id && (
                  <Link to={`/twins/${p.twin_id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                    {p.twin_id} →
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
