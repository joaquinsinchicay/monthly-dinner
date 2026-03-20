import { GoogleSignInButton } from '@/components/google-sign-in-button';

export default function HomePage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  return (
    <main>
      <section className="hero">
        <p className="small">Monthly Dinner MVP v1.0</p>
        <h1>Entrá con Google para sumarte a tus grupos.</h1>
        <p>
          Si ya existe una cuenta con tu email, Supabase iniciará sesión en el usuario existente sin duplicar
          perfiles.
        </p>
        <p>
          Si tu sesión sigue vigente en este dispositivo, te llevaremos directamente al panel sin pedirte volver
          a autenticarte.
        </p>
        <GoogleSignInButton nextPath={searchParams?.next} />
      </section>
    </main>
  );
}
