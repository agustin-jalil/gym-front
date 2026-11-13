import * as React from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/** El aspecto de cada variante vive en globals.css (por `data-variant`); acá solo van tamaños y layout. */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: Variant
}

export function Button({ variant = 'default', size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} data-variant={variant} className={cn(buttonVariants({ size }), className)} {...props} />
}

export interface ButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, 'className'>,
    VariantProps<typeof buttonVariants> {
  variant?: Variant
  className?: string
}

export function ButtonLink({ variant = 'default', size, className, ...props }: ButtonLinkProps) {
  return <Link data-variant={variant} className={cn(buttonVariants({ size }), className)} {...props} />
}
