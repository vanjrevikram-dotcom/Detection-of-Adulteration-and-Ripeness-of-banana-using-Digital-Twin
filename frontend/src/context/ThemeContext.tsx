import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface ThemeCtx { dark: boolean; toggle: () => void }
const Ctx = createContext<ThemeCtx>({ dark: true, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return <Ctx.Provider value={{ dark, toggle: () => setDark(!dark) }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
