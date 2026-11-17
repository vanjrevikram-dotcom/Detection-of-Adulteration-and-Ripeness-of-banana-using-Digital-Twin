import { Link } from 'react-router-dom'
import { FaBullseye, FaChartLine, FaShieldAlt } from 'react-icons/fa'
import Reveal from '../components/Reveal'

export default function About() {
  return (
    <div className="space-y-8">
      <div className="card page-anim">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">About the project</p>
        <h1 className="mt-1 text-3xl font-extrabold">Why BananaTwin Exists</h1>
        <p className="mt-3 max-w-3xl text-black dark:text-white">
          Bananas are graded and traded on ripeness, yet grading is still mostly visual and
          subjective — and chemically-ripened (adulterated) fruit is hard to spot with the naked
          eye. BananaTwin combines <b>RGB vision, thermal imaging, and thermal-matrix data</b> with
          two trained neural networks to give an objective ripeness stage, an AI-estimated
          adulteration likelihood, and a persistent per-fruit history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          [FaBullseye, 'Objective grading', 'A 5-stage classifier replaces guesswork with measured probabilities for every stage.'],
          [FaShieldAlt, 'Adulteration screening', 'An RGB screener flags likely chemically-ripened fruit before it reaches consumers.'],
          [FaChartLine, 'Traceability', 'Each banana gets a Digital Twin ID with observations, forecasts and explanations — farm to shelf.']
        ].map(([Icon, t, d]: any, i) => (
          <Reveal key={t} delay={i * 90}>
            <div className="card card-hover group h-full">
              <span className="icon-badge"><Icon size={22} /></span>
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-black dark:text-white">{d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="card">
          <h2 className="text-xl font-bold">How the system works</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {[
              'Upload RGB + thermal images and the thermal-matrix XLSX for a banana batch sample.',
              'The ripeness model (EfficientNet-B0 dual branch + matrix MLP) predicts one of 5 stages with confidence.',
              'The adulteration model (EfficientNet-B0, RGB-only) estimates Natural vs Adulterated likelihood.',
              'Results attach to a Digital Twin (BT-000001…) building a chronological observation history.',
              'A heuristic forecaster predicts the next expected stage; Grad-CAM explains what the models saw.'
            ].map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-brand-50 p-3 transition-all duration-300 hover:translate-x-1 hover:bg-brand-50 hover:shadow-md dark:bg-brand-500/10 dark:hover:bg-brand-500/10">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-md shadow-brand-500/40">{i + 1}</span>
                <span className="text-black dark:text-white">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <Reveal>
        <div className="card card-hover border-l-4 !border-l-amber-500">
          <h2 className="font-bold">Honest limitations</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-black dark:text-white">
            <li>Adulteration output is an <b>AI-estimated likelihood</b> — not chemical concentration, not lab certification.</li>
            <li>Future-stage forecasts are <b>history heuristics</b>, not a trained temporal model.</li>
            <li>Metrics shown are <b>past experimental test results</b>, not guarantees on your images.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/performance" className="btn-primary text-sm">See performance report</Link>
            <Link to="/register" className="btn-ghost text-sm">Get started</Link>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
