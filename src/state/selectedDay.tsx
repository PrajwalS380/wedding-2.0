import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { wedding } from '../config/wedding'

export type DayId = (typeof wedding.days)[number]['id']

interface SelectedDay {
  day: DayId
  setDay: (day: DayId) => void
}

const Ctx = createContext<SelectedDay | null>(null)

/** The wedding day chosen in the calendar, shared with the celebrations section. */
export function SelectedDayProvider({ children }: { children: ReactNode }) {
  const [day, setDay] = useState<DayId>('day-1')
  const value = useMemo(() => ({ day, setDay }), [day])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSelectedDay(): SelectedDay {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSelectedDay must be used inside SelectedDayProvider')
  return v
}
