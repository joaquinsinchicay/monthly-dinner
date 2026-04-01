export default function SettingsLoading() {
  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 pb-16 pt-20">
      <div className="mx-auto max-w-[480px] space-y-10">

        {/* Back link skeleton */}
        <div className="h-5 w-28 rounded-full bg-[#ede9e8] animate-pulse" />

        {/* Members section skeleton */}
        <section>
          <div className="h-3 w-24 rounded-full bg-[#ede9e8] animate-pulse mb-2" />
          <div className="h-8 w-48 rounded-full bg-[#ede9e8] animate-pulse mb-5" />
          <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-0 py-1 space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#ede9e8] animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 rounded-full bg-[#ede9e8] animate-pulse" />
                <div className="w-14 h-5 rounded-full bg-[#ede9e8] animate-pulse" />
              </div>
            ))}
          </div>
        </section>

        {/* Rotation section skeleton */}
        <section>
          <div className="h-3 w-32 rounded-full bg-[#ede9e8] animate-pulse mb-2" />
          <div className="h-8 w-44 rounded-full bg-[#ede9e8] animate-pulse mb-5" />
          <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-[#ede9e8] animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 rounded-full bg-[#ede9e8] animate-pulse" />
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
