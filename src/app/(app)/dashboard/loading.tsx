export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="mt-2 h-4 w-24 rounded bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
