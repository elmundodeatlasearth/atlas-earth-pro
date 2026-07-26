// src/components/skeleton.tsx
// Skeleton loading placeholders with shimmer animation
"use client";

function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white/5 rounded-lg ${className}`}>
      <Shimmer />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#121212] rounded-xl border border-white/5 p-5 space-y-3">
      <SkeletonBar className="h-3 w-1/3" />
      <SkeletonBar className="h-8 w-2/3" />
      <SkeletonBar className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
