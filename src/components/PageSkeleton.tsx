/**
 * Shared navigation skeleton — renders instantly while the target route's
 * payload arrives, so clicking LVM / NFS / Containers never feels frozen.
 * Static markup only: no JS, one cheap CSS opacity pulse.
 */
export default function PageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" aria-label="Loading page" className="flex flex-col">
      {/* header */}
      <div className="surface p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="h-6 w-52 animate-pulse rounded-md bg-secondary" />
          <div className="h-8 w-32 animate-pulse rounded-lg bg-secondary" />
        </div>
        <div className="mt-5 h-9 w-2/3 animate-pulse rounded-md bg-secondary" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded-md bg-secondary/70" />
        <div className="mt-5 flex flex-wrap gap-2">
          {[64, 88, 76, 96].map((w, i) => (
            <div key={i} className="h-6 animate-pulse rounded-full bg-secondary" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* content grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <div className="surface h-[300px] animate-pulse p-5">
            <div className="h-3.5 w-40 rounded bg-secondary" />
            <div className="mt-6 h-11 rounded-xl bg-secondary/70" />
            <div className="mt-3 h-11 rounded-xl bg-secondary/70" />
            <div className="mt-3 h-11 rounded-xl bg-secondary/70" />
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="surface overflow-hidden">
            <div className="flex border-b border-border">
              {[72, 64, 68, 80].map((w, i) => (
                <div key={i} className="flex-1 py-3.5">
                  <div className="mx-auto h-3 animate-pulse rounded bg-secondary" style={{ width: w }} />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 p-5 md:p-6">
              <div className="h-4 w-full animate-pulse rounded bg-secondary/70" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-secondary/70" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-secondary/70" />
              <div className="mt-4 h-20 w-full animate-pulse rounded-lg bg-secondary/50" />
              <div className="h-20 w-full animate-pulse rounded-lg bg-secondary/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
