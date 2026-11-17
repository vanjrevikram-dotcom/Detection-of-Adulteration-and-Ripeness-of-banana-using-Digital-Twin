import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaLightbulb, FaSpinner } from 'react-icons/fa'
import { api, errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import FileUpload from '../components/FileUpload'
import Reveal from '../components/Reveal'

export default function Adulteration() {
  const [rgb, setRgb] = useState<File | null>(null)
  const [searchParams] = useSearchParams()
  // Internal workflow value only: bound when launched from a Twin detail
  // "Add New Observation" deep-link (?twin=BT-XXXXXX). Never shown as a selector.
  const [twinId, setTwinId] = useState(searchParams.get('twin') ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [xai, setXai] = useState<any>(null)
  const [xaiBusy, setXaiBusy] = useState(false)
  const [xaiError, setXaiError] = useState<string | null>(null)

  const requestGradCam = async (file: File) => {
    setXaiBusy(true); setXai(null); setXaiError(null)
    try {
      const fd = new FormData()
      fd.append('rgb', file)
      const { data } = await api.post('/api/explain/adulteration', fd, { timeout: 300000 })
      setXai(data)
    } catch (err) { setXaiError(errorMessage(err)) }
    finally { setXaiBusy(false) }
  }

  const submit = async () => {
    if (!rgb) { toast('Upload an RGB image.', 'error'); return }
    setBusy(true); setResult(null); setXai(null); setXaiError(null)
    try {
      const fd = new FormData()
      fd.append('rgb', rgb)
      if (twinId) fd.append('twin_id', twinId)
      const { data } = await api.post('/api/predict/adulteration', fd)
      setResult(data)
      // Stay bound to the Twin so repeat analyses update the same Twin.
      if (data.twin_id) setTwinId(data.twin_id)
      toast(data.twin_created ? `New Twin ${data.twin_id} created with first observation` : `Adulteration result saved to Twin ${data.twin_id}`, 'success')
      // Auto-request Grad-CAM explanation for the same image (existing XAI service).
      void requestGradCam(rgb)
    } catch (err) { toast(errorMessage(err), 'error') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Adulteration Analysis </h1>
      <p className="text-sm text-black dark:text-white">Result is an AI-estimated likelihood — not chemical concentration and not laboratory certification.</p>
      <div className="card space-y-4">
        <FileUpload label="RGB image" accept=".jpg,.jpeg,.png" hint="JPG or PNG photo of the banana" file={rgb} onFile={setRgb} />
        <div className="flex justify-center">
          <button onClick={submit} disabled={busy} className="btn-primary btn-analyze w-full md:w-auto md:min-w-64">{busy ? 'Analyzing…' : 'Analyze Adulteration'}</button>
        </div>
      </div>
      {result && (
        <div className="card">
          <div className="flex flex-wrap items-center gap-4">
            {result.rgb_url && <img src={result.rgb_url} alt="RGB" className="h-36 rounded-xl object-cover" />}
            <div>
              <p className="text-sm text-black dark:text-white">Adulteration Status</p>
              <p className={`text-3xl font-extrabold ${result.status === 'Natural' ? 'text-green-500' : 'text-red-500'}`}>{result.status}</p>
              <p className="mt-1 text-sm">Natural: <b>{(result.natural_probability * 100).toFixed(1)}%</b> · Adulterated: <b>{(result.adulterated_probability * 100).toFixed(1)}%</b> · Confidence: <b>{(result.confidence * 100).toFixed(1)}%</b></p>
              <p className="mt-1 text-xs italic text-black dark:text-white">{result.disclaimer}</p>
              {result.twin_id && (
                <p className="mt-2 text-sm">Digital Twin <b className="font-mono text-brand-600">{result.twin_id}</b> {result.twin_created ? 'created' : 'updated'} · <Link to={`/twins/${result.twin_id}`} className="font-semibold text-brand-600 hover:underline">View Digital Twin →</Link></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Explainability (Grad-CAM) ---------- */}
      {(result && (xaiBusy || xai || xaiError)) && (
        <Reveal>
          <div className="card card-hover">
            <h2 className="flex items-center gap-2 font-bold text-brand-600"><FaLightbulb /> Explainability · Grad-CAM</h2>
            {xaiBusy && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                  <FaSpinner className="animate-spin text-brand-500" /> Generating Grad-CAM heatmap — highlighting the regions the model focused on…
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div className="skeleton h-52" />
                  <div className="skeleton h-52" />
                </div>
              </div>
            )}
            {xaiError && !xaiBusy && (
              <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                <p className="font-bold text-red-500">Grad-CAM generation failed</p>
                <p className="mt-1 text-black dark:text-white">{xaiError}</p>
                <button
                  onClick={() => rgb && void requestGradCam(rgb)}
                  className="btn-ghost mt-3 text-sm"
                >
                  Retry explanation
                </button>
              </div>
            )}
            {xai && !xaiBusy && (
              <div className="mt-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-sm font-semibold">Original RGB image</p>
                    {result.rgb_url && (
                      <img src={result.rgb_url} alt="Original RGB" className="w-full rounded-xl border border-brand-500/25 object-cover transition-all duration-300 hover:shadow-xl dark:border-brand-500/30" />
                    )}
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold">Grad-CAM heatmap <span className="font-normal text-black dark:text-white">(input · heatmap · overlay)</span></p>
                    <img src={xai.gradcam_rgb_url} alt="Adulteration Grad-CAM heatmap" className="w-full rounded-xl border border-brand-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/20 dark:border-brand-500/30" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-black dark:text-white">
                  {xai.method ?? 'Grad-CAM on the adulteration model backbone.'} Saved via the backend explanation store — no new model involved.
                </p>
              </div>
            )}
          </div>
        </Reveal>
      )}
    </div>
  )
}
