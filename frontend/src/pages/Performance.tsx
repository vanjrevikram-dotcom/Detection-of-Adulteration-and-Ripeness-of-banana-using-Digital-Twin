import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import { AXIS, tooltipTheme } from '../components/chartTheme'
import { useTheme } from '../context/ThemeContext'

interface PerClass { stage: string; precision: number; recall: number; f1: number; support: number }
interface ModelPerf {
  model: string; inputs: string[]; test_samples: number; best_epoch: number
  test: Record<string, number>; per_class: PerClass[]
  confusion_matrix: { labels: string[]; matrix: number[][] }
  curve: { epoch: number; train_loss: number; train_acc: number; val_loss: number; val_acc: number; val_f1: number }[]
  images: { confusion_matrix: string; curves: string }
}

function shortLabel(s: string) {
  return s.replace('Stage_', 'S').replace(/_/g, ' ')
}

function ConfusionTable({ labels, matrix }: { labels: string[]; matrix: number[][] }) {
  const max = Math.max(...matrix.flat())
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr>
            <th className="p-2 text-xs text-black dark:text-white">True ↓ · Pred →</th>
            {labels.map((l) => <th key={l} className="p-2 text-xs font-semibold">{shortLabel(l)}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i]}>
              <td className="p-2 text-xs font-semibold">{shortLabel(labels[i])}</td>
              {row.map((v, j) => (
                <td key={j} className="p-2 font-bold transition-transform duration-200 hover:scale-110"
                  style={{ backgroundColor: `rgba(249,115,22,${0.06 + 0.8 * (v / max)})`, color: v > max / 2 ? '#fff' : undefined }}
                  title={`${labels[i]} → ${labels[j]}: ${v}`}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ModelSection({ title, accent, perf, anim }: { title: string; accent: string; perf: ModelPerf; anim: string }) {
  const t = perf.test
  const { dark } = useTheme()
  const cards: [string, string][] = [
    ['Test Accuracy', `${t.accuracy.toFixed(2)}%`],
    ['Macro F1', t.macro_f1.toFixed(4)],
    ['Macro Precision', t.macro_precision.toFixed(4)],
    ['Macro Recall', t.macro_recall.toFixed(4)],
    ...(t.roc_auc !== undefined ? [['ROC-AUC', t.roc_auc.toFixed(4)] as [string, string]] : []),
    ['Test Loss', t.loss.toFixed(4)]
  ]
  return (
    <section className={`card page-anim ${anim}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{title}</p>
      <h2 className="mt-1 text-xl font-extrabold">{perf.model}</h2>
      <p className="mt-1 text-sm text-black dark:text-white">
        Inputs: {perf.inputs.join(' + ')} · Test samples: <b>{perf.test_samples}</b> · Best epoch: <b>{perf.best_epoch}</b>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-brand-500/25 p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-brand-500/30">
            <p className={`text-2xl font-extrabold ${accent}`}>{v}</p>
            <p className="text-xs text-black dark:text-white">{k}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-bold">Per-class F1-score</h3>
          <div className="h-64 text-black dark:text-white">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perf.per_class.map((c) => ({ name: shortLabel(c.stage), F1: c.f1, Precision: c.precision, Recall: c.recall }))} margin={{ bottom: 40 }}>
                <CartesianGrid stroke="#f97316" strokeOpacity={0.25} strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fontSize: 11, fill: 'currentColor' }} height={60} />
                <YAxis domain={[0, 1]} stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fill: 'currentColor' }} />
                <Tooltip {...tooltipTheme(dark)} />
                <Legend formatter={(v) => <span className="text-black dark:text-white">{v}</span>} />
                <Bar dataKey="F1" fill="#f97316" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Precision" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Recall" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-bold">Training curves (accuracy & loss)</h3>
          <div className="h-64 text-black dark:text-white">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perf.curve}>
                <CartesianGrid stroke="#f97316" strokeOpacity={0.25} strokeDasharray="3 3" />
                <XAxis dataKey="epoch" stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fontSize: 11, fill: 'currentColor' }} />
                <YAxis yAxisId="acc" stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fontSize: 11, fill: 'currentColor' }} />
                <YAxis yAxisId="loss" orientation="right" stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fontSize: 11, fill: 'currentColor' }} />
                <Tooltip {...tooltipTheme(dark)} />
                <Legend formatter={(v) => <span className="text-black dark:text-white">{v}</span>} />
                <Line yAxisId="acc" type="monotone" dataKey="train_acc" name="train acc %" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line yAxisId="acc" type="monotone" dataKey="val_acc" name="val acc %" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line yAxisId="loss" type="monotone" dataKey="val_loss" name="val loss" stroke="#38bdf8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-bold">Confusion matrix (interactive)</h3>
          <ConfusionTable labels={perf.confusion_matrix.labels} matrix={perf.confusion_matrix.matrix} />
        </div>
        <div>
          <h3 className="mb-2 font-bold">Confusion matrix (figure)</h3>
          <img src={perf.images.confusion_matrix} alt={`${title} confusion matrix`}
            className="w-full rounded-xl border border-brand-500/25 transition-all duration-300 hover:shadow-xl dark:border-brand-500/30" />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 font-bold">Training curves (figure)</h3>
        <img src={perf.images.curves} alt={`${title} training curves`}
          className="w-full rounded-xl border border-brand-500/25 transition-all duration-300 hover:shadow-xl dark:border-brand-500/30" />
      </div>
    </section>
  )
}

export default function Performance() {
  const [data, setData] = useState<{ ripeness: ModelPerf; adulteration: ModelPerf; note: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/models/performance')
      .then((r) => setData(r.data))
      .catch((err) => toast(errorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4"><div className="skeleton h-40" /><div className="skeleton h-64" /></div>
  if (!data) return <p className="text-sm text-black dark:text-white">Could not load performance data.</p>

  return (
    <div className="space-y-6">
      <div className="card page-anim">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Experimental evaluation</p>
        <h1 className="text-3xl font-extrabold">Model Performance</h1>
        <p className="mt-2 max-w-3xl text-sm text-black dark:text-white">
          Held-out test results transcribed from the training notebooks
          (<span className="font-mono">Ripeness_stages.ipynb</span> Step 12,{' '}
          <span className="font-mono">banana_adulteration.ipynb</span> Step 7).
          These describe past experimental evaluation — not guarantees about live predictions.
        </p>
      </div>
      <ModelSection title="Model 1 · Ripeness" accent="text-brand-500" perf={data.ripeness} anim="page-anim-1" />
      <ModelSection title="Model 2 · Adulteration" accent="text-green-500" perf={data.adulteration} anim="page-anim-2" />
      <p className="page-anim page-anim-3 text-center text-xs text-black dark:text-white">{data.note}</p>
    </div>
  )
}
