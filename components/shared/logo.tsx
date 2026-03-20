export function Logo() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-lg font-bold text-white shadow-lg shadow-primary/20">
        MD
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight">monthly-dinner</p>
        <p className="text-sm text-on-surface-variant">Cenas del Jueves</p>
      </div>
    </div>
  );
}
