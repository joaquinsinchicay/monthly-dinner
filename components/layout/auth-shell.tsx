import type { PropsWithChildren } from 'react';

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center px-4 py-8"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #ECFDF5 50%, #FFFFFF 100%)',
      }}
    >
      <div className="w-full max-w-[400px]">{children}</div>
      <footer className="mt-8 text-center">
        <p className="text-xs uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          THE CURATED TABLE © 2024
        </p>
      </footer>
    </main>
  );
}
