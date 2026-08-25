/**
 * Shown instantly while the next section's data loads, so navigation never
 * looks frozen. Only the content area is replaced — the sidebar stays.
 */
export default function DashboardLoading() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-line" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-line/70" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
