/** Shared button styling (also used for links that look like buttons). */
export type ButtonVariant = 'emerald' | 'maroon' | 'ivory'

const base =
  'relative inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full px-6 py-2.5 caps text-[0.8125rem] font-semibold ' +
  'transition-[background-color,box-shadow,transform,color,border-color] duration-[var(--dur-base)] ease-[var(--ease-silk)] ' +
  'active:translate-y-px disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  emerald:
    'bg-emerald text-gold-pale border border-gold/70 shadow-[0_10px_24px_-12px_rgb(10_39_29/0.7),inset_0_1px_0_rgb(255_255_255/0.12)] ' +
    'hover:bg-emerald-deep hover:border-gold-light [--focus-ring:var(--color-gold-deep)]',
  maroon:
    'bg-maroon text-ivory border border-gold/60 shadow-[0_10px_24px_-12px_rgb(90_19_32/0.7),inset_0_1px_0_rgb(255_255_255/0.12)] ' +
    'hover:bg-maroon-deep hover:border-gold-light',
  ivory:
    'bg-ivory/90 text-emerald-deep border border-gold/60 shadow-[0_8px_20px_-14px_rgb(74_48_14/0.6)] ' +
    'hover:bg-ivory hover:border-gold',
}

export const buttonClass = (variant: ButtonVariant = 'emerald', extra = '') => `${base} ${variants[variant]} ${extra}`
