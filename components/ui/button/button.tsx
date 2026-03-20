import { cn } from '@/lib/utils/cn';
import type { ButtonProps } from './button.types';

export function Button({
  className,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('ui-button', `ui-button--${variant}`, `ui-button--${size}`, fullWidth && 'ui-button--full', className)}
      {...props}
    />
  );
}
