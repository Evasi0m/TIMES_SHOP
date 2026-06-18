export function Skeleton({ className = '' }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card">
      <div className="product-card__media">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="product-card__body">
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[70%]" />
        <div className="product-card__price-row">
          <Skeleton className="h-5 w-[45%]" />
          <Skeleton className="h-3 w-[35%]" />
        </div>
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

export function ProductScrollSkeleton({ count = 5 }) {
  return (
    <div className="home-section">
      <Skeleton className="h-5 w-36" />
      <div className="home-scroll-row">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="home-product-card">
            <Skeleton className="aspect-square w-full rounded-[10px]" />
            <div className="flex flex-col gap-1.5 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
