import { Link } from 'react-router-dom'
import { FaBrain, FaCamera, FaChartLine, FaClone, FaCrosshairs, FaExclamationTriangle, FaFlask, FaLeaf, FaLightbulb, FaLink, FaMicroscope } from 'react-icons/fa'
import { LuBanana } from 'react-icons/lu'
import HeroVisual from '../components/HeroVisual'
import Reveal from '../components/Reveal'

const stages = ['Stage 1 · Mature Green', 'Stage 2 · Green-Yellow Transition', 'Stage 3 · Early Ripening', 'Stage 4 · Fully Yellow', 'Stage 5 · Yellow Spotted']

const features = [
  [FaCrosshairs, '5-Stage Ripeness Detection', 'Multimodal RGB + thermal + matrix fusion classifies bananas across all five commercial ripeness stages.'],
  [FaMicroscope, 'Adulteration Likelihood', 'RGB-based screening estimates Natural vs Adulterated probability — honest AI likelihood, not lab certification.'],
  [FaLink, 'Combined Analysis', 'Run both trained models on one upload set. No retraining, no merged network — one unified report.'],
  [FaClone, 'Digital Twin History', 'Every banana gets a persistent Twin ID (BT-000001…) with observations, predictions and timeline.'],
  [FaChartLine, 'Future-Stage Forecast', 'History-based heuristic predicts the next expected stage with probability and time estimate.'],
  [FaLightbulb, 'Explainable AI', 'Grad-CAM heatmaps for RGB/thermal plus SHAP Explanation for the thermal matrix, on demand.']
]

const steps = [
  [FaCamera, 'Upload', 'RGB, thermal image & matrix XLSX'],
  [FaBrain, 'Multimodal AI', 'Ripeness + adulteration models'],
  [FaClone, 'Digital Twin', 'State saved under Twin ID'],
  [FaChartLine, 'Forecast', 'Next stage prediction'],
  [FaLightbulb, 'Explain', 'Grad-CAM & importance maps']
]

export default function Landing() {
  return (
    <div className="space-y-12">
      {/* ---------- HERO ---------- */}
      <section className="card overflow-hidden py-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="page-anim text-left">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-600">Multimodal AI · Digital Twin · Explainable AI</p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              AI-Powered Banana Ripeness & <span className="text-brand-500">Adulteration Intelligence</span>
            </h1>
            <p className="mt-4 max-w-xl text-black dark:text-white">
              Multimodal RGB + thermal analysis for 5-stage ripeness assessment and AI-estimated
              adulteration likelihood — with persistent Digital Twins, future-stage forecasting
              and Grad-CAM / SHAP explanations.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30">Get Started</Link>
              <Link to="/predict/combined" className="btn-ghost transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">Explore Analysis</Link>
              <Link to="/performance" className="btn-ghost transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">View model performance →</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {[['88.70%', 'ripeness accuracy'], ['89.11%', 'adulteration accuracy'], ['95.33%', 'ROC-AUC']].map(([v, l]) => (
                <span key={l} className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <b className="text-brand-600">{v}</b> <span className="text-black dark:text-white">{l}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="page-anim page-anim-1">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ---------- modality strip ---------- */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 text-sm md:grid-cols-3">
        {[['RGB + Thermal + Matrix', 'Multimodal ripeness model (5 stages)'], ['RGB analysis', 'Adulteration likelihood: Natural vs Adulterated'], ['Digital Twin + Forecast', 'History, future-stage forecast & XAI per banana']].map(([t, d], i) => (
          <Reveal key={t} delay={i * 90}>
            <div className="card card-hover !p-4">
              <p className="font-bold text-brand-600">{t}</p><p className="text-black dark:text-white">{d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ---------- how it works ---------- */}
      <Reveal>
        <section className="card">
          <h2 className="text-center text-xl font-bold">How It Works</h2>
          <div className="relative mt-6 hidden md:block">
            <svg className="absolute left-0 right-0 top-7 h-1 w-full" preserveAspectRatio="none" viewBox="0 0 100 2">
              <line x1="0" y1="1" x2="100" y2="1" stroke="#f97316" strokeWidth="1" className="flow-line" opacity="0.5" />
            </svg>
            <div className="relative grid grid-cols-5 gap-2">
              {steps.map(([Icon, t, d]: any, i) => (
                <div key={t} className="card-hover group rounded-xl border border-brand-500/25 bg-white p-3 text-center dark:border-brand-500/30 dark:bg-black">
                  <span className="icon-badge"><Icon size={20} /></span>
                  <p className="mt-2 text-sm font-bold">{t}</p>
                  <p className="text-xs text-black dark:text-white">{d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:hidden">
            {steps.map(([Icon, t, d]: any) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-brand-500/25 p-3 dark:border-brand-500/30">
                <span className="icon-badge !h-10 !w-10"><Icon size={18} /></span>
                <div><p className="text-sm font-bold">{t}</p><p className="text-xs text-black dark:text-white">{d}</p></div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ---------- features ---------- */}
      <section>
        <Reveal><h2 className="text-center text-xl font-bold">Everything You Need for Banana Intelligence</h2></Reveal>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, t, d]: any, i) => (
            <Reveal key={t} delay={(i % 3) * 90}>
              <div className="card card-hover group h-full">
                <span className="icon-badge"><Icon size={22} /></span>
                <h3 className="mt-3 font-bold transition-colors group-hover:text-brand-600">{t}</h3>
                <p className="mt-1 text-sm text-black dark:text-white">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- two models ---------- */}
      <section className="grid gap-4 md:grid-cols-2">
        <Reveal className="h-full">
          <div className="card card-hover group h-full">
            <h3 className="flex items-center gap-2 font-bold text-brand-600"><LuBanana size={22} /> Ripeness Model</h3>
            <p className="mt-1 text-sm text-black dark:text-white">Inputs: RGB + Thermal + Thermal Matrix → 5 ripeness stages. EfficientNet-B0 dual branch + matrix MLP with feature fusion.</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {stages.map((s, i) => (
                <li key={s} className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 transition-all duration-300 hover:translate-x-1 hover:bg-brand-50 dark:bg-brand-500/10 dark:hover:bg-brand-500/10">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-600">{i + 1}</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={120} className="h-full">
          <div className="card card-hover group flex h-full flex-col">
            <h3 className="flex items-center gap-2 font-bold text-brand-600"><FaFlask size={20} /> Adulteration Model</h3>
            <p className="mt-1 text-sm text-black dark:text-white">Input: RGB only → Natural / Adulterated (EfficientNet-B0, 2-class). Output is an AI-estimated likelihood — not chemical concentration and not laboratory certification.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border-2 border-green-500/40 bg-green-500/10 p-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-green-500/20">
                <FaLeaf className="mx-auto text-2xl text-green-500" /><p className="mt-1 font-bold text-green-600">Natural</p>
              </div>
              <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-red-500/20">
                <FaExclamationTriangle className="mx-auto text-2xl text-red-500" /><p className="mt-1 font-bold text-red-500">Adulterated</p>
              </div>
            </div>
            <Link to="/predict/adulteration" className="btn-ghost mt-4 text-center text-sm">Try adulteration screening →</Link>
          </div>
        </Reveal>
      </section>

      {/* ---------- metrics ---------- */}
      <Reveal>
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">Experimental Model Evaluation Results</h2>
              <p className="text-sm text-black dark:text-white">Held-out test metrics — not live accuracy guarantees.</p>
            </div>
            <Link to="/performance" className="btn-primary text-sm">Full performance report →</Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="card-hover rounded-xl border border-brand-500/25 p-5 text-center dark:border-brand-500/30">
              <p className="font-bold">Ripeness (5-class · 469 samples)</p>
              <p className="mt-2 text-4xl font-extrabold text-brand-500">88.70%</p>
              <p className="text-sm text-black dark:text-white">Test Accuracy · Macro F1 <b className="text-brand-600">84.03%</b></p>
            </div>
            <div className="card-hover rounded-xl border border-brand-500/25 p-5 text-center dark:border-brand-500/30">
              <p className="font-bold">Adulteration (2-class · 450 samples)</p>
              <p className="mt-2 text-4xl font-extrabold text-green-500">89.11%</p>
              <p className="text-sm text-black dark:text-white">Test Accuracy · ROC-AUC <b className="text-brand-600">95.33%</b></p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ---------- CTA ---------- */}
      <Reveal>
        <section className="card relative overflow-hidden !border-black bg-black text-center dark:!border-brand-500/30">
          <div className="blob absolute -left-10 -top-10 h-40 w-40 rounded-full bg-brand-500/30" />
          <div className="blob absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-brand-500/20" style={{ animationDelay: '2s' }} />
          <div className="relative">
            <h2 className="text-2xl font-extrabold text-white">Start tracking your bananas today</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white">Create a free account, register a Digital Twin, and run your first multimodal analysis in minutes.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/register" className="btn-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/40">Get Started Free</Link>
              <Link to="/contact" className="rounded-xl border border-brand-500/50 px-4 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-400">Talk to us</Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
