import { useEffect, useState } from 'react'

/**
 * The current time, refreshed every `intervalMs` while the page is visible.
 * Ticks stop in background tabs and resync immediately when the tab returns.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: number | undefined
    const start = () => {
      stop()
      setNow(new Date())
      // align ticks to the next whole second so the countdown changes on the second
      const delay = intervalMs - (Date.now() % intervalMs)
      timer = window.setTimeout(function tick() {
        setNow(new Date())
        timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs))
      }, delay)
    }
    const stop = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = undefined
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])
  return now
}
