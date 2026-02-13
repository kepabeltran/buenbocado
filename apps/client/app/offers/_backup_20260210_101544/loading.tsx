export default function LoadingOffers() {
  return (
    <div className="min-h-[100svh] bg-slate-100">
      <div className="mx-auto min-h-[100svh] w-full max-w-[520px] bg-white shadow-sm">
        <div className="sticky top-0 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-3 h-8 w-full rounded-full bg-slate-100" />
        </div>

        <div className="space-y-3 px-4 pb-24 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="h-16 w-16 rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-4 w-44 rounded bg-slate-200" />
                <div className="h-3 w-36 rounded bg-slate-100" />
              </div>
              <div className="w-16 space-y-2 text-right">
                <div className="h-4 w-16 rounded bg-slate-200" />
                <div className="ml-auto h-3 w-10 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[520px] px-2 py-2">
            <div className="h-10 flex-1 rounded-xl bg-slate-100" />
            <div className="mx-2 h-10 flex-1 rounded-xl bg-slate-100" />
            <div className="h-10 flex-1 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
