import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FaChevronDown, FaClone, FaHistory, FaSignOutAlt, FaUser } from 'react-icons/fa'
import { LuBanana } from 'react-icons/lu'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/use-cases', label: 'Use Cases' },
  { to: '/contact', label: 'Contact' }
]

const appLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/predict/ripeness', label: 'Ripeness' },
  { to: '/predict/adulteration', label: 'Adulteration' },
  { to: '/predict/combined', label: 'Combined' },
  { to: '/twins', label: 'Digital Twins' }
]

const profileMenu = [
  { to: '/profile', label: 'My Profile', icon: FaUser },
  { to: '/predictions', label: 'My Predictions', icon: FaHistory },
  { to: '/twins', label: 'My Digital Twins', icon: FaClone }
]

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `nav-link relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:-translate-y-px hover:bg-brand-50 dark:hover:bg-brand-500/15 ${
    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-black dark:text-white'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const links = user ? appLinks : publicLinks

  useEffect(() => {
    if (!drop) return
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDrop(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [drop])

  const doLogout = () => { logout(); setDrop(false); setOpen(false); nav('/') }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-500/25 bg-white/90 shadow-sm backdrop-blur transition-colors duration-300 dark:border-brand-500/30 dark:bg-black/90">
      <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to={user ? '/dashboard' : '/'} className="group relative z-10 flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"><LuBanana size={20} /></span>
          <span className="transition-colors group-hover:text-brand-600">
           Banana Twin<span className="text-brand-500"> AI</span>
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls}>
              {l.label}
            </NavLink>
          ))}
          {!user && (
            <NavLink to="/predict/combined" className="ml-1 rounded-lg bg-brand-500/10 px-3 py-1.5 text-sm font-semibold text-brand-600 transition-all duration-300 hover:-translate-y-px hover:bg-brand-500 hover:text-white hover:shadow-lg hover:shadow-brand-500/30 dark:text-brand-400">
              Live Demo
            </NavLink>
          )}
        </nav>

        <div className="relative z-10 ml-auto flex items-center gap-2">
          <button
            onClick={toggle}
            title="Toggle theme"
            className="rounded-xl border border-brand-500/40 px-3 py-1.5 text-sm transition-all duration-300 hover:-translate-y-px hover:border-brand-500 hover:shadow-md hover:shadow-brand-500/20 dark:border-brand-500/40"
          >
            <span className="inline-block transition-transform duration-500 hover:rotate-180">{dark ? '☀' : '🌙'}</span>
          </button>
          {user ? (
            <div ref={dropRef} className="relative hidden sm:block">
              <button
                onClick={() => setDrop(!drop)}
                className="flex items-center gap-2 rounded-xl border border-brand-500/40 py-1.5 pl-1.5 pr-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-px hover:border-brand-500 hover:shadow-md hover:shadow-brand-500/20"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">
                  {(user.name?.[0] ?? 'U').toUpperCase()}
                </span>
                <span className="max-w-24 truncate">{user.name?.split(' ')[0]}</span>
                <FaChevronDown size={11} className={`text-brand-500 transition-transform duration-300 ${drop ? 'rotate-180' : ''}`} />
              </button>
              <div className={`absolute right-0 top-full mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-brand-500/25 bg-white shadow-2xl shadow-brand-500/15 transition-all duration-200 dark:border-brand-500/30 dark:bg-black ${drop ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}>
                <p className="truncate border-b border-brand-500/20 px-4 py-2.5 text-xs text-black dark:text-white">{user.email}</p>
                {profileMenu.map((m) => (
                  <Link
                    key={m.to + m.label}
                    to={m.to}
                    onClick={() => setDrop(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-black transition-all duration-200 hover:translate-x-0.5 hover:bg-brand-500/10 hover:text-brand-600 dark:text-white"
                  >
                    <m.icon size={14} className="text-brand-500" /> {m.label}
                  </Link>
                ))}
                <button
                  onClick={doLogout}
                  className="flex w-full items-center gap-2.5 border-t border-brand-500/20 px-4 py-2.5 text-sm font-medium text-black transition-all duration-200 hover:translate-x-0.5 hover:bg-brand-500/10 hover:text-brand-600 dark:text-white"
                >
                  <FaSignOutAlt size={14} className="text-brand-500" /> Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost px-3 py-1.5 text-sm">Login</Link>
              <Link to="/register" className="btn-primary px-3 py-1.5 text-sm">Get Started</Link>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="rounded-xl border border-brand-500/40 px-3 py-1.5 text-sm transition-all hover:border-brand-500 dark:border-brand-500/40 lg:hidden"
          >
            <span className={`burger ${open ? 'open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu — animated expand/collapse */}
      <div className={`mobile-menu overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out lg:hidden ${open ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="flex flex-col gap-1 px-4 pb-4">
          {links.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${i * 30}ms` : '0ms' }}
              className={({ isActive }) =>
                `mobile-link rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:translate-x-1 hover:bg-brand-50 dark:hover:bg-brand-500/15 ${
                  isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-black dark:text-white'
                } ${open ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              {profileMenu.map((m, i) => (
                <NavLink
                  key={m.to + m.label}
                  to={m.to}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${(links.length + i) * 30}ms` : '0ms' }}
                  className={({ isActive }) =>
                    `mobile-link rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:translate-x-1 hover:bg-brand-50 dark:hover:bg-brand-500/15 ${
                      isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-black dark:text-white'
                    } ${open ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'}`
                  }
                >
                  {m.label}
                </NavLink>
              ))}
              <button
                onClick={doLogout}
                className="btn-ghost mt-1 px-3 py-2 text-sm sm:hidden"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="mt-1 flex gap-2 sm:hidden">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 px-3 py-2 text-center text-sm">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 px-3 py-2 text-center text-sm">Get Started</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
