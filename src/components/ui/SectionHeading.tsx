import type { ReactNode } from 'react'
import { OrnamentDivider } from './Ornament'

interface Props {
  id: string
  eyebrow?: string
  title: ReactNode
  /** Render the title in the calligraphic script face. */
  scriptTitle?: boolean
  lead?: ReactNode
  className?: string
}

/** Eyebrow · heading · ornament · lead — the shared section header. */
export function SectionHeading({ id, eyebrow, title, scriptTitle = false, lead, className = '' }: Props) {
  return (
    <header className={`mx-auto max-w-[var(--prose-max)] text-center ${className}`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2
        id={`${id}-title`}
        className={
          scriptTitle
            ? 'script text-[clamp(2.6rem,9vw,4.5rem)] text-emerald-deep'
            : 'caps text-[clamp(1.6rem,5vw,2.4rem)] font-medium tracking-[0.18em] text-emerald-deep'
        }
      >
        {title}
      </h2>
      <OrnamentDivider className="mx-auto mt-4" />
      {lead && <p className="mt-4 text-[1.0625rem] italic text-ink-soft">{lead}</p>}
    </header>
  )
}
