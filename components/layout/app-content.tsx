import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils/cn';

export function AppContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn('app-content', className)}>{children}</section>;
}
