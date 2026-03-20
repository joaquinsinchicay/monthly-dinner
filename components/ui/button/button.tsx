import { cn } from '@/lib/utils/cn';

import type { ButtonProps } from './button.types';

const variantClassNames: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'inline-flex items-center rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70',
  secondary:
    'inline-flex items-center rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-70',
  ghost: 'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container',
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(variantClassNames[variant], className)} {...props} />;
}
