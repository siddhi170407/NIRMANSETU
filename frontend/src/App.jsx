const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5 sm:px-10">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-amber-300">
            NS
          </span>
          <span className="text-lg font-semibold tracking-tight">NirmanSetu</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16 sm:px-10 sm:py-24">
        <section aria-labelledby="page-title" className="max-w-3xl">
          <p className="mb-6 text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
            Building the foundation
          </p>
          <h1 id="page-title" className="text-5xl font-bold tracking-tight sm:text-7xl">
            NirmanSetu<span className="text-amber-500">.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-600 sm:text-2xl">
            Public Infrastructure Project Monitoring System
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
            A foundation for following public infrastructure projects from
            planning to completion. The application is in its initial setup phase.
          </p>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="font-semibold">Application foundation</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The React homepage and Django health API are ready for local
              development. Project workflows and role-based access will follow.
            </p>
            <a
              href={`${apiBaseUrl}/health/`}
              className="mt-6 inline-flex items-center gap-3 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
            >
              Open health API <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8 text-xs text-slate-500 sm:px-10">
        NirmanSetu · Infrastructure with accountability
      </footer>
    </div>
  )
}

export default App
