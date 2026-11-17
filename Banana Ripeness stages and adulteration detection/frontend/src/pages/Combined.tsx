import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import { toast } from '../components/Toast'
import FileUpload from '../components/FileUpload'
import { ProbChart } from './Ripeness'

export default function Combined() {
  const [rgb, setRgb] = useState<File | null>(null)
  const [thermal, setThermal] = useState<File | null>(null)
  const [matrix, setMatrix] = useState<File | null>(null)
  const [searchParams] = useSearchParams()
  // Internal workflow value only: bound when launched from a Twin detail
  // "Add New Observation" deep-link (?twin=BT-XXXXXX). Never shown as a selector.
  const [twinId, setTwinId] = useState(searchParams.get('twin') ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<any>(null)

  const submit = async () => {
    if (!rgb || !thermal || !matrix) { toast('Upload RGB, thermal and matrix files.', 'error'); return }
    setBusy(true); setResult(null)
    try {
      const fd = new FormData()
      fd.append('rgb', rgb); fd.append('thermal', thermal); fd.append('matrix', matrix)
      if (twinId) fd.append('twin_id', twinId)
      fd.append('explain', 'true')
      const { data } = await api.post('/api/predict/combined', fd, { timeout: 300000 })
      setResult(data)
      // Stay bound to the Twin so repeat analyses update the same Twin.
      if (data.twin_id) setTwinId(data.twin_id)
      toast(data.twin_created ? `New Twin ${data.twin_id} created with first observation` : `Combined analysis saved to Twin ${data.twin_id}`, 'success')
    } catch (err) { toast(errorMessage(err), 'error') }
    finally { setBusy(false) }
  }

  const ex = result?.explanations ?? {}
  const img = (u?: string) => u ? <img src={u} alt="explanation" className="w-full rounded-xl border border-brand-500/25 dark:border-brand-500/30" /> : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Combined Analysis </h1>
      <div className="grid gap-3 md:grid-cols-3">
        <FileUpload label="RGB image" accept=".jpg,.jpeg,.png" hint="JPG or PNG photo of the banana" file={rgb} onFile={setRgb} />
        <FileUpload label="Thermal image" accept=".jpg,.jpeg,.png" hint="JPG or PNG thermal capture" file={thermal} onFile={setThermal} />
        <FileUpload label="Thermal Matrix" accept=".xlsx,.xls,.csv" hint="XLSX / CSV 256×192 temperature grid" file={matrix} onFile={setMatrix} />
      </div>
      <div className="card flex justify-center">
        <button onClick={submit} disabled={busy} className="btn-primary btn-analyze w-full md:w-auto md:min-w-64">{busy ? 'Running both models + XAI… (may take ~30s)' : 'Run Combined Analysis'}</button>
      </div>
      {busy && <div className="skeleton h-64" />}
      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card">
              <h2 className="font-bold text-brand-600">RIPENESS RESULT</h2>
              <p className="text-xl font-extrabold">{result.ripeness.predicted_stage}</p>
              <p className="text-sm">Ripeness: <b>{result.ripeness.ripeness_percentage}%</b> · Confidence: <b>{(result.ripeness.confidence * 100).toFixed(1)}%</b></p>
              <ProbChart data={result.ripeness.stage_probabilities} />
            </div>
            <div className="card">
              <h2 className="font-bold text-brand-600">ADULTERATION RESULT</h2>
              <p className={`text-xl font-extrabold ${result.adulteration.status === 'Natural' ? 'text-green-500' : 'text-red-500'}`}>{result.adulteration.status}</p>
              <p className="text-sm">Natural: <b>{(result.adulteration.natural_probability * 100).toFixed(1)}%</b> · Adulterated: <b>{(result.adulteration.adulterated_probability * 100).toFixed(1)}%</b></p>
              <p className="text-sm">Confidence: <b>{(result.adulteration.confidence * 100).toFixed(1)}%</b></p>
              <p className="mt-1 text-xs italic text-black dark:text-white">AI-estimated likelihood, not lab certification.</p>
              {result.twin_id && <p className="mt-2 text-sm">Digital Twin <b className="font-mono text-brand-600">{result.twin_id}</b> {result.twin_created ? 'created' : 'updated'} · <Link to={`/twins/${result.twin_id}`} className="font-semibold text-brand-600 hover:underline">View Digital Twin →</Link></p>}
              {result.forecast && (
                <div className="mt-3 rounded-xl bg-brand-50 p-3 text-sm dark:bg-brand-500/10">
                  <p className="font-bold">Future-stage forecast</p>
                  <p>Next: <b>{result.forecast.future_stage}</b> ({(result.forecast.probability * 100).toFixed(0)}%)</p>
                  <p className="text-xs">{result.forecast.estimated_time}</p>
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <h2 className="font-bold">EXPLAINABILITY</h2>
            {!result.explanations ? <p className="text-sm text-black dark:text-white">Explanations unavailable for this run.</p> : (
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div><p className="mb-1 text-sm font-semibold">Grad-CAM · Ripeness RGB</p>{img(ex.gradcam_rgb_url)}</div>
                <div><p className="mb-1 text-sm font-semibold">Grad-CAM · Ripeness Thermal</p>{img(ex.gradcam_thermal_url)}</div>
                <div>
                  <p className="mb-1 text-sm font-semibold">SHAP Explanation · Thermal Matrix</p>
                  {img(ex.matrix_importance_url)}
                  {ex.matrix_shap && (
                    <p className="mt-1 text-xs text-black dark:text-white">
                      Target Stage: <b>{ex.matrix_shap.target_stage}</b> · Probability: <b>{(ex.matrix_shap.probability * 100).toFixed(1)}%</b> · Mean |SHAP|: <b>{ex.matrix_shap.summary.mean_abs_shap.toExponential(2)}</b>
                    </p>
                  )}
                </div>
                <div><p className="mb-1 text-sm font-semibold">Grad-CAM · Adulteration RGB</p>{img(ex.adulteration_gradcam_rgb_url)}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
