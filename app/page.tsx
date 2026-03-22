import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">monthly-dinner</p>
        <h1 className="mt-4 text-4xl font-semibold text-stone-900">Organiza tu cena mensual sin caos.</h1>
        <p className="mt-4 text-base text-stone-600">
          Accede con Google para entrar al panel principal y coordinar cada encuentro.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Ir al login
        </Link>
      </div>
    </main>
  );
}
