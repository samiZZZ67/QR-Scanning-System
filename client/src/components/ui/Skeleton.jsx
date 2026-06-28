export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-gold-muted/15 ${className}`} />;
}

export function MenuGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-surface rounded-lg border border-gold-muted/25 overflow-hidden"
        >
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5 }) {
  return (
    <div className="bg-pale-light rounded-lg border border-gold-muted/30 p-4 space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 items-center">
          <Skeleton className="h-12 w-12" />
          <Skeleton className="h-4 col-span-2" />
          <Skeleton className="h-4" />
          <Skeleton className="h-8" />
        </div>
      ))}
    </div>
  );
}

