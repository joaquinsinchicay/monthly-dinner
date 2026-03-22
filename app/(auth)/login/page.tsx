import { redirect } from 'next/navigation';

import { signInWithGoogle } from './actions';
import { createServerClient } from '@/lib/supabase/server';

interface LoginPageProps {
  searchParams?: {
    error?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const hasSoftError = searchParams?.error === 'oauth_failed';

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-stone-500">monthly-dinner</p>
        <h1 className="mt-4 text-3xl font-semibold text-stone-900">Ingresa con tu cuenta de Google</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Usa acceso sin contraseña para entrar al panel principal y continuar con la coordinación del grupo.
        </p>
        {hasSoftError ? (
          <p className="mt-4 rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
            No se pudo completar el flujo de Google. Puedes intentarlo nuevamente.
          </p>
        ) : null}
        <form action={signInWithGoogle} className="mt-8">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Ingresar con Google
          </button>
        </form>
      </section>
    </main>
  );
}
