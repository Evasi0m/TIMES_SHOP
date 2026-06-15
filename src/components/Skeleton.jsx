export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-surface-card ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card-canvas p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="mt-2 space-y-2">
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-3 w-[60%]" />
        <Skeleton className="h-5 w-[40%]" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
