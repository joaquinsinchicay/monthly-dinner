import type { PropsWithChildren } from 'react';

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className="bg-surface text-on-surface min-h-screen px-6 pb-12 pt-24">
      <div className="mx-auto max-w-4xl">{children}</div>
    </main>
  );
}
