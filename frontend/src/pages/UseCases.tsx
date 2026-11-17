import { Link } from 'react-router-dom'
import { FaGraduationCap, FaIndustry, FaShoppingCart, FaTractor, FaTruck, FaUniversity } from 'react-icons/fa'
import Reveal from '../components/Reveal'

const cases = [
  { icon: FaTractor, title: 'Farmers & Harvest Timing', problem: 'Picking too early or late cuts market value.', help: 'Stage-1 vs Stage-2 classification tells exactly when a lot is at mature-green vs transition, so harvest hits the buyers’ window.' },
  { icon: FaIndustry, title: 'Packhouses & Grading Lines', problem: 'Manual graders disagree and tire over shifts.', help: 'Objective 5-stage probabilities per sample standardize grading; twin histories document each lot.' },
  { icon: FaShoppingCart, title: 'Retail & Quality Assurance', problem: 'Shelf-life surprises cause waste and complaints.', help: 'Ripeness % plus next-stage forecasts predict sell-by windows; adulteration screening protects the brand.' },
  { icon: FaTruck, title: 'Cold-Chain & Logistics', problem: 'Ripening in transit is invisible until arrival.', help: 'Before/after observations on the same Twin ID quantify stage drift during transport.' },
  { icon: FaUniversity, title: 'Food-Safety Screening', problem: 'Chemically-ripened fruit is hard to prove in the field.', help: 'Fast RGB pre-screening flags suspect lots for confirmatory lab testing — triage, not certification.' },
  { icon: FaGraduationCap, title: 'Researchers & Students', problem: 'Multimodal agri-AI needs explainable baselines.', help: 'Open evaluation metrics, confusion matrices, Grad-CAM and SHAP outputs support study and teaching.' }
]

export default function UseCases() {
  return (
    <div className="space-y-8">
      <div className="card page-anim">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Use cases</p>
        <h1 className="mt-1 text-3xl font-extrabold">Who Uses BananaTwin</h1>
        <p className="mt-3 max-w-3xl text-black dark:text-white">
          From farm to lab — every hand that touches a banana gets an objective,
          explainable read on ripeness and adulteration risk.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((c, i) => (
          <Reveal key={c.title} delay={(i % 2) * 90}>
            <div className="card card-hover group h-full">
              <span className="icon-badge"><c.icon size={22} /></span>
              <h3 className="mt-3 font-bold">{c.title}</h3>
              <p className="mt-1 text-sm"><b className="text-red-500">Problem:</b> <span className="text-black dark:text-white">{c.problem}</span></p>
              <p className="mt-1 text-sm"><b className="text-green-500">How we help:</b> <span className="text-black dark:text-white">{c.help}</span></p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div className="card card-hover text-center">
          <p className="font-bold">See yourself here?</p>
          <div className="mt-3 flex justify-center gap-3">
            <Link to="/register" className="btn-primary text-sm">Get started</Link>
            <Link to="/contact" className="btn-ghost text-sm">Contact us</Link>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
