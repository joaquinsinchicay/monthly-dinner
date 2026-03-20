import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils/cn';

export function AppContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <main className={cn('w-full max-w-4xl px-0 md:px-6', className)}>{children}</main>;
}
