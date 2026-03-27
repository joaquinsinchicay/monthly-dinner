import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

// Compatibilidad con URLs antiguas — redirige a la ruta canónica del dashboard
export default function GrupoRedirectPage({ params }: Props) {
  redirect(`/dashboard/${params.id}`)
}
