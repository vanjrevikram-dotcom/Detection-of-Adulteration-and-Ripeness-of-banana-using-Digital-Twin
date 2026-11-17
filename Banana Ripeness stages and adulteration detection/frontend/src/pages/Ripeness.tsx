import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaDownload, FaSpinner } from 'react-icons/fa'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import FileUpload from '../components/FileUpload'
import { AXIS, tooltipTheme } from '../components/chartTheme'
import { downloadArtifact } from '../components/download'
import { useTheme } from '../context/ThemeContext'

export function ProbChart({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data).map(([name, value]) => ({ name: name.replace('Stage_', 'S').replace(/_/g, ' '), value: +(value * 100).toFixed(1) }))
  const { dark } = useTheme()
  return (
    <div className="h-64 text-black dark:text-white">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 120 }}>
          <XAxis type="number" domain={[0, 100]} stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fill: 'currentColor' }} />
          <YAxis type="category" dataKey="name" width={150} stroke={AXIS.stroke} tickLine={AXIS.tickLine} tick={{ fontSize: 11, fill: 'currentColor' }} />
          <Tooltip formatter={(v) => [`${v}%`, 'probability']} {...tooltipTheme(dark)} />
          <Bar dataKey="value" fill="#f97316" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface XaiState {
  status: 'idle' | 'loading' | 'error' | 'done'
  error?: string
  data?: any
}

function XaiFigure({ label, src, alt }: { label: string; src?: string; alt: string }) {
  if (!src) return null
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <img src={src} alt={alt} className="max-h-72 w-full rounded-xl border border-brand-500/25 object-contain transition-all duration-300 hover:shadow-xl dark:border-brand-500/30" />
    </div>
  )
}

function XaiLoading({ text }: { text: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-black dark:text-white">
        <FaSpinner className="animate-spin text-brand-500" /> {text}
      </div>
      <div className="skeleton mt-3 h-52" />
    </div>
  )
}

function XaiError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
      <p className="font-bold text-red-500">{message}</p>
      <button onClick={onRetry} className="btn-ghost mt-3 text-sm">Retry</button>
    </div>
  )
}

function DownloadButton({ busy, onClick, label }: { busy: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} disabled={busy} className="btn-primary mt-3 flex items-center gap-2 text-sm">
      {busy ? <FaSpinner className="animate-spin" /> : <FaDownload />} {busy ? 'Downloading…' : label}
    </button>
  )
}

export default function Ripeness() {
  const [rgb, setRgb] = useState<File | null>(null)
  const [thermal, setThermal] = useState<File | null>(null)
  const [matrix, setMatrix] = useState<File | null>(null)
  const [searchParams] = useSearchParams()
  // Internal workflow value only: bound when launched from a Twin detail
  // "Add New Observation" deep-link (?twin=BT-XXXXXX). Never shown as a selector.
  const [twinId, setTwinId] = useState(searchParams.get('twin') ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [xaiRgb, setXaiRgb] = useState<XaiState>({ status: 'idle' })
  const [xaiThermal, setXaiThermal] = useState<XaiState>({ status: 'idle' })
  const [xaiShap, setXaiShap] = useState<XaiState>({ status: 'idle' })
  const [dlBusy, setDlBusy] = useState<string | null>(null)

  const runXai = (
    set: (s: XaiState) => void, endpoint: string,
    files: { rgb: File; thermal: File; matrix: File }, timeout: number
  ) => {
    set({ status: 'loading' })
    const fd = new FormData()
    fd.append('rgb', files.rgb)
    fd.append('thermal', files.thermal)
    fd.append('matrix', files.matrix)
    api.post(endpoint, fd, { timeout })
      .then(({ data }) => set({ status: 'done', data }))
      .catch((err) => set({ status: 'error', error: errorMessage(err) }))
  }

  const download = async (key: string, url: string, filename: string) => {
    setDlBusy(key)
    try { await downloadArtifact(url, filename) }
    finally { setDlBusy(null) }
  }

  const submit = async () => {
    if (!rgb || !thermal || !matrix) { toast('Upload RGB, thermal and matrix files.', 'error'); return }
    const files = { rgb, thermal, matrix }
    setBusy(true); setResult(null)
    setXaiRgb({ status: 'idle' }); setXaiThermal({ status: 'idle' }); setXaiShap({ status: 'idle' })
    try {
      const fd = new FormData()
      fd.append('rgb', files.rgb); fd.append('thermal', files.thermal); fd.append('matrix', files.matrix)
      if (twinId) fd.append('twin_id', twinId)
      const { data } = await api.post('/api/predict/ripeness', fd)
      setResult(data)
      // Stay bound to the Twin so repeat analyses update the same Twin.
      if (data.twin_id) setTwinId(data.twin_id)
      toast(data.twin_created ? `New Twin ${data.twin_id} created with first observation` : `Ripeness saved to Twin ${data.twin_id}`, 'success')
      // Three independent XAI requests — each card populates on its own.
      runXai(setXaiRgb, '/api/explain/ripeness/rgb-gradcam', files, 180000)
      runXai(setXaiThermal, '/api/explain/ripeness/thermal-gradcam', files, 180000)
      runXai(setXaiShap, '/api/explain/ripeness/matrix-shap', files, 300000)
    } catch (err) { toast(errorMessage(err), 'error') }
    finally { setBusy(false) }
  }

  const retryRgb = () => { if (rgb && thermal && matrix) runXai(setXaiRgb, '/api/explain/ripeness/rgb-gradcam', { rgb, thermal, matrix }, 180000) }
  const retryThermal = () => { if (rgb && thermal && matrix) runXai(setXaiThermal, '/api/explain/ripeness/thermal-gradcam', { rgb, thermal, matrix }, 180000) }
  const retryShap = () => { if (rgb && thermal && matrix) runXai(setXaiShap, '/api/explain/ripeness/matrix-shap', { rgb, thermal, matrix }, 300000) }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ripeness Analysis </h1>
      <div className="grid gap-3 md:grid-cols-3">
        <FileUpload label="RGB image" accept=".jpg,.jpeg,.png" hint="JPG or PNG photo of the banana" file={rgb} onFile={setRgb} />
        <FileUpload label="Thermal image" accept=".jpg,.jpeg,.png" hint="JPG or PNG thermal capture" file={thermal} onFile={setThermal} />
        <FileUpload label="Thermal Matrix" accept=".xlsx,.xls,.csv" hint="XLSX / CSV 256×192 temperature grid" file={matrix} onFile={setMatrix} />
      </div>
      <div className="card flex justify-center">
        <button onClick={submit} disabled={busy} className="btn-primary btn-analyze w-full md:w-auto md:min-w-64">{busy ? 'Analyzing… (model inference)' : 'Analyze Ripeness'}</button>
      </div>
      {busy && <div className="skeleton h-48" />}
      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <p className="text-sm text-black dark:text-white">Current Stage</p>
            <p className="text-2xl font-extrabold text-brand-500">{result.predicted_stage}</p>
            <p className="mt-2 text-sm">Ripeness: <b>{result.ripeness_percentage}%</b> · Confidence: <b>{(result.confidence * 100).toFixed(1)}%</b></p>
            {result.twin_id && (
              <p className="mt-2 text-sm">Digital Twin <b className="font-mono text-brand-600">{result.twin_id}</b> {result.twin_created ? 'created' : 'updated'} · <Link to={`/twins/${result.twin_id}`} className="font-semibold text-brand-600 hover:underline">View Digital Twin →</Link></p>
            )}
            {(result.rgb_url || result.thermal_url) && (
              <div className="mt-3 flex gap-2">
                {result.rgb_url && <img src={result.rgb_url} alt="RGB" className="h-28 rounded-xl object-cover" />}
                {result.thermal_url && <img src={result.thermal_url} alt="Thermal" className="h-28 rounded-xl object-cover" />}
              </div>
            )}
          </div>
          <div className="card"><p className="mb-2 font-bold">Stage probabilities</p><ProbChart data={result.stage_probabilities} /></div>
        </div>
      )}
      {result && (xaiRgb.status !== 'idle' || xaiThermal.status !== 'idle' || xaiShap.status !== 'idle') && (
        <div className="card">
          <h2 className="text-xl font-bold">Explainable AI</h2>
          <p className="text-sm text-black dark:text-white">Each explanation is generated and loaded independently.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* CARD 1 — RGB Grad-CAM */}
            <div className="rounded-2xl border border-brand-500/25 p-4 dark:border-brand-500/30">
              <h3 className="font-bold text-brand-600">RGB Grad-CAM</h3>
              <p className="text-xs text-black dark:text-white">Visual regions influencing the ripeness prediction</p>
              <div className="mt-3">
                {xaiRgb.status === 'loading' && <XaiLoading text="Generating RGB Grad-CAM explanation…" />}
                {xaiRgb.status === 'error' && <XaiError message="RGB Grad-CAM could not be generated." onRetry={retryRgb} />}
                {xaiRgb.status === 'done' && (
                  <div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <XaiFigure label="Original RGB" src={result.rgb_url} alt="Original RGB" />
                      <XaiFigure label="Grad-CAM Heatmap" src={xaiRgb.data?.heatmap_url} alt="RGB Grad-CAM heatmap" />
                      <XaiFigure label="Grad-CAM Overlay" src={xaiRgb.data?.overlay_url} alt="RGB Grad-CAM overlay" />
                    </div>
                    <p className="mt-2 text-xs text-black dark:text-white">Method: <b>Grad-CAM</b></p>
                    {xaiRgb.data?.heatmap_url && (
                      <DownloadButton busy={dlBusy === 'rgb'} onClick={() => void download('rgb', xaiRgb.data.heatmap_url, 'ripeness_rgb_gradcam.png')} label="Download RGB Grad-CAM" />
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* CARD 2 — Thermal Grad-CAM */}
            <div className="rounded-2xl border border-brand-500/25 p-4 dark:border-brand-500/30">
              <h3 className="font-bold text-brand-600">Thermal Grad-CAM</h3>
              <p className="text-xs text-black dark:text-white">Thermal regions influencing the ripeness prediction</p>
              <div className="mt-3">
                {xaiThermal.status === 'loading' && <XaiLoading text="Generating Thermal Grad-CAM explanation…" />}
                {xaiThermal.status === 'error' && <XaiError message="Thermal Grad-CAM could not be generated." onRetry={retryThermal} />}
                {xaiThermal.status === 'done' && (
                  <div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <XaiFigure label="Original Thermal" src={result.thermal_url} alt="Original Thermal" />
                      <XaiFigure label="Grad-CAM Heatmap" src={xaiThermal.data?.heatmap_url} alt="Thermal Grad-CAM heatmap" />
                      <XaiFigure label="Grad-CAM Overlay" src={xaiThermal.data?.overlay_url} alt="Thermal Grad-CAM overlay" />
                    </div>
                    <p className="mt-2 text-xs text-black dark:text-white">Method: <b>Grad-CAM</b></p>
                    {xaiThermal.data?.heatmap_url && (
                      <DownloadButton busy={dlBusy === 'thermal'} onClick={() => void download('thermal', xaiThermal.data.heatmap_url, 'ripeness_thermal_gradcam.png')} label="Download Thermal Grad-CAM" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* CARD 3 — Thermal Matrix SHAP */}
          <div className="mt-4 rounded-2xl border border-brand-500/25 p-4 dark:border-brand-500/30">
            <h3 className="font-bold text-brand-600">Thermal Matrix SHAP</h3>
            <p className="text-xs text-black dark:text-white">SHAP contribution of thermal-matrix features</p>
            <div className="mt-3">
              {xaiShap.status === 'loading' && <XaiLoading text="Generating SHAP explanation… (single-sample GradientExplainer, may take ~30s)" />}
              {xaiShap.status === 'error' && <XaiError message="SHAP explanation could not be generated." onRetry={retryShap} />}
              {xaiShap.status === 'done' && (
                <div>
                  <p className="text-sm text-black dark:text-white">
                    Target Stage: <b>{xaiShap.data?.target_stage}</b> · Probability: <b>{xaiShap.data?.probability != null ? `${(xaiShap.data.probability * 100).toFixed(1)}%` : '—'}</b>
                  </p>
                  <div className="mt-2">
                    <XaiFigure label="SHAP Heatmap" src={xaiShap.data?.heatmap_url} alt="Thermal matrix SHAP heatmap" />
                  </div>
                  <p className="mt-2 text-sm text-black dark:text-white">
                    Mean |SHAP|: <b>{xaiShap.data?.summary ? Number(xaiShap.data.summary.mean_abs_shap).toExponential(2) : '—'}</b> · Max |SHAP|: <b>{xaiShap.data?.summary ? Number(xaiShap.data.summary.max_abs_shap).toExponential(2) : '—'}</b>
                  </p>
                  <p className="mt-1 text-xs text-black dark:text-white">Method: <b>SHAP GradientExplainer</b></p>
                  {xaiShap.data?.heatmap_url && (
                    <DownloadButton busy={dlBusy === 'shap'} onClick={() => void download('shap', xaiShap.data.heatmap_url, 'ripeness_thermal_matrix_shap.png')} label="Download SHAP Explanation" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
