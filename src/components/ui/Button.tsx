import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { buttonClass, type ButtonVariant } from './buttonStyles'

interface CommonProps {
  variant?: ButtonVariant
  icon?: ReactNode
  trailingIcon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'emerald',
  icon,
  trailingIcon,
  className = '',
  children,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...rest}>
      {icon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  )
}

export function ButtonLink({
  variant = 'emerald',
  icon,
  trailingIcon,
  className = '',
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClass(variant, className)} {...rest}>
      {icon}
      <span>{children}</span>
      {trailingIcon}
    </a>
  )
}
