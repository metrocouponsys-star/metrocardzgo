import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded-lg" />
      <Skeleton className="h-3 w-4/5 rounded-lg" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-outline-variant/20">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-[40%] rounded-lg" />
              <Skeleton className="h-3 w-[28%] rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-5 w-24 rounded-full self-center hidden md:block" />
          <Skeleton className="h-5 w-16 rounded-full self-center hidden md:block" />
          <Skeleton className="h-8 w-16 rounded-xl self-center hidden md:block" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card animate-pulse">
      <div className="flex justify-between items-start">
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      </div>
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}
