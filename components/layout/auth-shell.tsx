import type { PropsWithChildren } from 'react';
import { PageShell } from '@/components/ui';

export function AuthShell({ children }: PropsWithChildren) {
  return <PageShell className="page-shell--auth">{children}</PageShell>;
}
