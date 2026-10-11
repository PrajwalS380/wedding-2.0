import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext as Ctx } from './toastContext'
import './toast.css'

/**
 * A single, polite announcement area: brief confirmations (link copied, calendar
 * file downloaded) appear as an ivory toast and are read out by screen readers.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [shown, setShown] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const notify = useCallback((m: string) => {
    window.clearTimeout(timer.current)
    setMessage(m)
    setShown(true)
    timer.current = window.setTimeout(() => setShown(false), 4200)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <Ctx.Provider value={notify}>
      {children}
      <div className={`toast ${shown ? 'is-shown' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </Ctx.Provider>
  )
}
