import { Link } from 'react-router-dom'
import { FaChartLine, FaClone, FaLightbulb, FaLink, FaMicroscope } from 'react-icons/fa'
import { LuBanana } from 'react-icons/lu'
import Reveal from '../components/Reveal'

const services = [
  { icon: LuBanana, title: 'Ripeness Assessment', to: '/predict/ripeness', inputs: 'RGB + thermal + matrix XLSX', out: 'Stage 1–5, ripeness %, stage probabilities' },
  { icon: FaMicroscope, title: 'Adulteration Screening', to: '/predict/adulteration', inputs: 'RGB image', out: 'Natural / Adulterated + both probabilities' },
  { icon: FaLink, title: 'Combined Analysis', to: '/predict/combined', inputs: 'RGB + thermal + matrix XLSX', out: 'Ripeness + adulteration + forecast + XAI in one report' },
  { icon: FaClone, title: 'Digital Twin Tracking', to: '/twins', inputs: 'Any analysis attached to a Twin ID', out: 'Timeline, history, current state per banana' },
  { icon: FaChartLine, title: 'Future-Stage Forecast', to: '/twins', inputs: 'Twin observation history', out: 'Next expected stage, probability, time estimate' },
  { icon: FaLightbulb, title: 'Explainability Reports', to: '/predict/combined', inputs: 'Completed analysis', out: 'Grad-CAM heatmaps + SHAP Explanation figures' }
]

export default function Services() {
  return (
    <div className="space-y-8">
      <div className="card page-anim">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Services</p>
        <h1 className="mt-1 text-3xl font-extrabold">What BananaTwin Does for You</h1>
        <p className="mt-3 max-w-3xl text-black dark:text-white">
          Six capabilities built on the two trained models — from single-image screening
          to full lifecycle tracking with forecasts and explanations.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <Reveal key={s.title} delay={(i % 3) * 90}>
            <div className="card card-hover group flex h-full flex-col">
              <span className="icon-badge"><s.icon size={22} /></span>
              <h3 className="mt-3 font-bold transition-colors group-hover:text-brand-600">{s.title}</h3>
              <p className="mt-1 text-xs text-black dark:text-white">In: {s.inputs}</p>
              <p className="mt-1 text-sm text-black dark:text-white">Out: {s.out}</p>
              <Link to={s.to} className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">Open →</Link>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
