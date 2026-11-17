import { Link } from 'react-router-dom'
import { LuBanana } from 'react-icons/lu'

const cols = [
  {
    title: 'Product',
    links: [
      { to: '/predict/ripeness', label: 'Ripeness Analysis' },
      { to: '/predict/adulteration', label: 'Adulteration Screening' },
      { to: '/predict/combined', label: 'Combined Analysis' },
      { to: '/twins', label: 'Digital Twins' }
    ]
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About the Project' },
      { to: '/services', label: 'Services' },
      { to: '/use-cases', label: 'Use Cases' },
      { to: '/contact', label: 'Contact' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { to: '/register', label: 'Get Started' },
      { to: '/login', label: 'Login' },
      { to: '/profile', label: 'Your Profile' },
      { to: '/performance', label: 'Model Performance' }
    ]
  }
]

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-brand-500/25 bg-white/60 dark:border-brand-500/30 dark:bg-black/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="footer-fade">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30"><LuBanana size={20} /></span>
          </div>
          <p className="mt-3 max-w-xs text-sm font-semibold leading-relaxed text-black dark:text-white">
            Digital Twin–Enabled Banana Adulteration Detection, Ripeness Assessment and Future-Stage Prediction Using Multimodal RGB–Thermal Image Processing, Advanced Machine Learning, Deep Learning and Full-Stack Deployment.
          </p>
          <div className="mt-4 flex gap-2">
            {['RGB', 'Thermal', 'Matrix'].map((m) => (
              <span
                key={m}
                className="cursor-default rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-600 transition-all duration-300 hover:-translate-y-1 hover:bg-brand-500 hover:text-white hover:shadow-lg hover:shadow-brand-500/30 dark:text-brand-400"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.title} className="footer-fade">
            <p className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.to + l.label}>
                  <Link
                    to={l.to}
                    className="footer-link group inline-flex items-center gap-1 text-sm text-black transition-all duration-300 hover:translate-x-1 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                  >
                    <span className="inline-block h-px w-0 bg-brand-500 transition-all duration-300 group-hover:w-3" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-brand-500/25 dark:border-brand-500/30">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs font-medium text-black dark:text-white">
          Digital Twin–Enabled Banana Adulteration Detection, Ripeness Assessment and Future-Stage Prediction Using Multimodal RGB–Thermal Image Processing, Advanced Machine Learning, Deep Learning and Full-Stack Deployment.
        </p>
      </div>
    </footer>
  )
}
