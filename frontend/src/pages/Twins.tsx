import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { toast } from '../components/Toast'

export default function Twins() {
  const [twins, setTwins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/api/twins'); setTwins(data) }
    catch (err) { toast(errorMessage(err), 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    const name = prompt('Twin name:', 'My Banana')
    if (!name) return
    try { const { data } = await api.post('/api/twins', { name }); setTwins((t) => [data, ...t]); toast(`Twin ${data.twin_id} created`, 'success') }
    catch (err) { toast(errorMessage(err), 'error') }
  }

  const remove = async (id: string) => {
    if (!confirm(`Delete twin ${id}?`)) return
    try { await api.delete(`/api/twins/${id}`); setTwins((t) => t.filter((x) => x.twin_id !== id)); toast('Twin deleted', 'success') }
    catch (err) { toast(errorMessage(err), 'error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Digital Twins</h1>
        <button onClick={create} className="btn-primary text-sm">+ New Twin</button>
      </div>
      {loading ? <div className="skeleton h-40" /> : twins.length === 0 ? (
        <div className="card text-center text-sm text-black dark:text-white">No twins yet. Create one to start tracking observations.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {twins.map((t) => (
            <div key={t.twin_id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="font-mono text-xs text-brand-600">{t.twin_id}</p>
                </div>
                <button onClick={() => remove(t.twin_id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
              <p className="mt-2 text-sm text-black dark:text-white">
                {t.current_stage ?? 'No stage yet'} · {t.ripeness_percentage ?? '—'}% · {t.adulteration_status ?? '—'}
              </p>
              <Link to={`/twins/${t.twin_id}`} className="mt-3 inline-block text-sm font-semibold text-brand-600">Open timeline →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
