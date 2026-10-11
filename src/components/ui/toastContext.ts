import { createContext, useContext } from 'react'

type Notify = (message: string) => void
export const ToastContext = createContext<Notify>(() => {})

/** Show a brief, polite confirmation (see ToastProvider). */
export const useToast = () => useContext(ToastContext)
