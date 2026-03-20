import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

export function PageShell({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={cn('min-h-screen', className)} {...props} />;
}
