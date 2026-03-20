export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-outline-variant/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-on-surface-variant">Monthly Dinner</p>
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Dashboard</h1>
        </div>
        <span className="rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-secondary">MVP Auth</span>
      </div>
    </header>
  );
}
