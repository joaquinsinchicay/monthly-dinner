import { Suspense } from 'react'
import AuthCallbackPage from './callback-client'

export default function Page() {
  return (
    <Suspense fallback={
      <main>
        <section className="panel">
          <p className="small">Autenticación</p>
          <h1>Procesando callback OAuth</h1>
          <p>Validando tu acceso con Google…</p>
        </section>
      </main>
    }>
      <AuthCallbackPage />
    </Suspense>
  )
}
