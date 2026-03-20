import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-lg',
        className,
      )}
      {...props}
    />
  );
}
