// Indicador de carga post-callback (US-02 §12)
// Mostrado por Next.js mientras dashboard/page.tsx resuelve el smart redirect
// (verificación de cookie last_group_id + query a members + redirect final).
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf9f8]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner — primary color, sin border sólido */}
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#dce2f3] border-t-[#004ac6]"
          aria-hidden="true"
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Cargando…
        </p>
      </div>
    </div>
  )
}
