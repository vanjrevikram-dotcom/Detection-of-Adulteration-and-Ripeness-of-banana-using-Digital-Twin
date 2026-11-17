import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import { AXIS, tooltipTheme } from '../components/chartTheme'
import BananaModel3D from '../components/BananaModel3D'
import { useTheme } from '../context/ThemeContext'

const STAGE_IDX: Record<string, number> = {
  Stage_1_Mature_Green: 1, Stage_2_Green_Yellow_Transition: 2,
  Stage_3_Early_Ripening: 3, Stage_4_Fully_Yellow: 4, Stage_5_Yellow_Spotted: 5
}

export default function TwinDetail() {
  const { id } = useParams()
  const [twin, setTwin] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { dark } = useTheme()

  useEffect(() => {
    (async () => {
      try {
        const [t, h] = await Promise.all([
          api.get(`/api/twins/${id}`), api.get(`/api/twins/${id}/history`)])
        setTwin(t.data); setHistory(h.data)
        try {
          const f = await api.get(`/api/twins/${id}/forecast`)
          setForecast(f.data.forecast)
        } catch { /* no observations yet */ }
      } catch (err) { toast(errorMessage(err), 'error') }
      finally { setLoading(false) }
    })()
  }, [id])

  if (loading) return <div className="skeleton h-64" />
  if (!twin) return <p>Twin not found.</p>

  const chart = history
    .filter((o) => o.predicted_stage && STAGE_IDX[o.predicted_stage])
    .map((o, i) => ({ n: `Obs ${i + 1}`, stage: STAGE_IDX[o.predicted_stage], ripe: o.ripeness_percentage ?? null }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{twin.name} <span className="font-mono text-sm text-brand-600">{twin.twin_id}</span></h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card"><p className="text-xs text-black dark:text-white">Current Stage</p><p className="font-extrabold text-brand-500">{twin.current_stage ?? '—'}</p></div>
        <div className="card"><p className="text-xs text-black dark:text-white">Ripeness</p><p className="font-extrabold">{twin.ripeness_percentage ?? '—'}%</p></div>
        <div className="card"><p className="text-xs text-black dark:text-white">Adulteration</p><p className="font-extrabold">{twin.adulteration_status ?? '—'} ({twin.adulteration_probability != null ? `${(twin.adulteration_probability * 100).toFixed(1)}%` : '—'})</p></div>
      </div>
      {forecast && (
        <div className="card border-brand-300 dark:border-brand-500/40">
          <p className="font-bold text-brand-600">Future-stage forecast</p>
          <p className="text-sm">Next expected stage: <b>{forecast.future_stage}</b> · probability {(forecast.probability * 100).toFixed(0)}%</p>
          <p className="text-xs text-black dark:text-white">{forecast.estimated_time} · method: {forecast.method} (trained LSTM forecaster)</p>
        </div>
      )}
      <div className="card">
        <h2 className="font-bold">Add New Observation</h2>
        <p className="mt-1 text-sm text-black dark:text-white">Launch an analysis with this Twin already bound — the result updates this same Twin.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/predict/ripeness?twin=${twin.twin_id}`} className="btn-primary text-sm">+ Ripeness observation</Link>
          <Link to={`/predict/adulteration?twin=${twin.twin_id}`} className="btn-primary text-sm">+ Adulteration observation</Link>
          <Link to={`/predict/combined?twin=${twin.twin_id}`} className="btn-primary text-sm">+ Combined observation</Link>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">3D Banana Model</h2>
          <p className="mb-2 text-xs text-black dark:text-white">Interactive digital-twin visualization</p>
          <BananaModel3D stage={twin.current_stage} />
        </div>
        <div className="card">
          <h2 className="font-bold">Ripeness progression</h2>
          <p className="mb-2 text-xs text-black dark:text-white">
            The LSTM uses 3–5 input frames; shorter histories are padded by repeating the earliest observation.
          </p>
          {chart.length === 0 ? <p className="text-sm text-black dark:text-white">No observations yet.</p> : (
            <div className="h-56 text-black dark:text-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <XAxis dataKey="n" stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fill: 'currentColor' }} /><YAxis domain={[0, 5]} stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fill: 'currentColor' }} />
                  <Tooltip {...tooltipTheme(dark)} /><Line type="monotone" dataKey="stage" stroke="#f97316" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <h2 className="font-bold">Timeline</h2>
        {history.length === 0 ? <p className="text-sm text-black dark:text-white">Empty timeline.</p> : (
          <ol className="mt-2 space-y-2">
            {history.map((o, i) => (
              <li key={o.id} className="rounded-xl border border-brand-500/25 p-3 text-sm dark:border-brand-500/30">
                <p className="font-semibold">Observation {i + 1} <span className="font-normal text-black dark:text-white">{o.observation_time?.slice(0, 16).replace('T', ' ')}</span></p>
                <p>Stage: {o.predicted_stage ?? '—'} · Ripe: {o.ripeness_percentage ?? '—'}% · Adulteration: {o.adulteration_status ?? '—'}</p>
                {i < history.length - 1 && <p className="text-center text-brand-500">↓</p>}
              </li>
            ))}
            <li className="rounded-xl bg-brand-50 p-3 text-sm font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">Current state → {forecast ? `future: ${forecast.future_stage}` : twin.current_stage}</li>
          </ol>
        )}
      </div>
    </div>
  )
}
