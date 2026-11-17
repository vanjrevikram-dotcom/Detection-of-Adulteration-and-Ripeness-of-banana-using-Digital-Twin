import { Link } from 'react-router-dom'
import { FaCheckCircle } from 'react-icons/fa'
import { LuBanana } from 'react-icons/lu'

export function AuthShell({ title, subtitle, children, footer }: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-clip rounded-3xl">
      <div className="blob pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25" />
      <div className="blob pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-brand-500/15" style={{ animationDelay: '3s' }} />
      <div className="card relative grid overflow-hidden !p-0 shadow-2xl shadow-brand-500/10 md:grid-cols-[1fr_1.1fr]">
        {/* brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-black p-8 text-white md:flex dark:bg-brand-500">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/40 dark:bg-black"><LuBanana size={22} /></span>
              <span className="text-lg">Banana<span className="text-brand-500 dark:text-black">Twin</span></span>
            </div>
            <h2 className="mt-8 text-3xl font-extrabold leading-tight">Ripeness & adulteration intelligence for every banana.</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {['5-stage multimodal ripeness grading', 'AI adulteration screening', 'Digital Twins with future forecasts'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <FaCheckCircle className="shrink-0 text-brand-500 dark:text-black" /> <span className="text-white dark:text-black">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-brand-500/30 pt-5 text-sm">
            <Link to="/performance" className="font-semibold text-brand-500 hover:underline dark:text-black">
              View experimental model results →
            </Link>
          </div>
        </div>
        {/* form panel */}
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-black dark:text-white">{subtitle}</p>
          <div className="mt-5">{children}</div>
          <div className="mt-4 text-center text-sm">{footer}</div>
        </div>
      </div>
    </div>
  )
}

export function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="label font-semibold">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-600 dark:text-brand-300">{icon}</span>
        {children}
      </div>
    </div>
  )
}

export const fieldInput = 'input !pl-11 transition-all duration-300 focus:shadow-lg focus:shadow-brand-500/20'
