import { useState, useEffect } from 'react'

export interface Toast { id: number; message: string; kind: 'error' | 'success' | 'info' }

let pushExternal: ((t: Omit<Toast, 'id'>) => void) | null = null
export const toast = (message: string, kind: Toast['kind'] = 'info') => pushExternal?.({ message, kind })

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    pushExternal = ({ message, kind }) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, kind }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
    }
    return () => { pushExternal = null }
  }, [])
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-xl border px-4 py-2 text-sm shadow-lg ${
          t.kind === 'error' ? 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
          : t.kind === 'success' ? 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
          : 'border-brand-500/40 bg-white text-black dark:border-brand-500/40 dark:bg-black dark:text-white'}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
