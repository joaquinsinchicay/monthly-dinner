import Link from "next/link";

export default function JoinLandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="max-w-md rounded-2xl bg-surface-lowest p-8 shadow-card-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Invitaciones</p>
        <h1 className="mt-3 font-display text-3xl text-on-surface">Abre el link completo que recibiste.</h1>
        <p className="mt-3 text-sm text-secondary">Cada invitación incluye un token único con el formato <code>/join/[token]</code>.</p>
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-primary-gradient px-5 py-3 text-sm font-semibold text-white">Ir a login</Link>
      </section>
    </main>
  );
}
