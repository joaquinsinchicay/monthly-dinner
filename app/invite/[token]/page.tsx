import Link from 'next/link';

const validTokens = new Set(['demo-token']);

export default function InvitePage({ params }: { params: { token: string } }) {
  const isValid = validTokens.has(params.token);

  return (
    <main className="login-page">
      <section className="hero-card surface-card stack-gap">
        <p className="label">Invitación al grupo</p>
        <h1>{isValid ? 'Unite a Cenas del Jueves' : 'Este link ya no es válido'}</h1>
        <p className="body-md muted-copy">
          {isValid
            ? 'Si iniciás sesión con Google, tu cuenta queda asociada automáticamente al grupo.'
            : 'Pedile al organizador que genere una nueva invitación o revise si el enlace venció.'}
        </p>
        <div className="soft-panel">
          <p className="body-sm">Token: {params.token}</p>
          <p className="body-sm">Estado: {isValid ? 'Vigente y listo para usar' : 'Expirado o revocado'}</p>
        </div>
        <Link className="primary-link-button" href={isValid ? '/login?next=/group/group-curated-table' : '/login'}>
          {isValid ? 'Ingresar con Google y unirme' : 'Volver al login'}
        </Link>
      </section>
    </main>
  );
}
