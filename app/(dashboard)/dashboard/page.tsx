export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-3xl bg-white p-10 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Dashboard</p>
        <h1 className="mt-4 text-3xl font-semibold text-stone-900">Bienvenido a monthly-dinner</h1>
        <p className="mt-3 text-stone-600">
          La sesión fue validada correctamente y ya puedes continuar con el flujo autenticado.
        </p>
      </section>
    </main>
  );
}
