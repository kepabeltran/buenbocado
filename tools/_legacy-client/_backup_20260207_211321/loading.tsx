import Link from "next/link";

function CardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100" />
        <div className="absolute left-4 top-4 h-7 w-24 rounded-full bg-white/70 backdrop-blur" />
        <div className="absolute right-4 top-4 h-7 w-40 rounded-full bg-white/70 backdrop-blur" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="h-6 w-44 rounded-full bg-white/70 backdrop-blur" />
            <div className="h-6 w-60 rounded-xl bg-white/70 backdrop-blur" />
          </div>
          <div className="h-14 w-24 rounded-2xl bg-white/70 backdrop-blur" />
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="h-4 w-full rounded bg-zinc-100 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-zinc-100 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-zinc-100 animate-pulse" />
        <div className="flex justify-end pt-2">
          <div className="h-10 w-28 rounded-xl border border-zinc-200 bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main
      className="min-h-[100svh] bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(59,130,246,0.10),transparent_50%),linear-gradient(to_bottom,rgba(250,250,250,1),rgba(244,244,245,1))] text-zinc-900"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/offers" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white text-sm font-black">
              BB
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BuenBocado</div>
              <div className="text-xs text-zinc-500">ofertas de última hora</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <span className="hidden h-10 w-28 rounded-xl border border-zinc-200 bg-white sm:inline-flex" />
            <span className="h-10 w-28 rounded-xl bg-zinc-900/90" />
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" />
            Cargando ofertas…
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
            Ofertas cerca de ti
          </h1>
          <p className="mt-1 text-sm text-zinc-700">Un segundo y te las saco 👀</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </main>
  );
}