import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton block — an animated shimmer placeholder.
 * Compose these to build page-specific loading layouts.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-200',
        className
      )}
    />
  );
}

/** A full card placeholder */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-5 shadow-sm', className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-2" />
      <div className="flex justify-between mt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** A horizontal list item placeholder */
export function SkeletonRow({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center justify-between p-4 border-b border-gray-100 last:border-0', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-7 w-16 rounded-full" />
    </div>
  );
}

/** Stat card placeholder — a gradient box with number+label */
export function SkeletonStat({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-5 shadow-sm', className)}>
      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/** Profile form placeholder */
export function SkeletonProfile() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Avatar */}
      <div className="flex items-center gap-5 mb-6">
        <Skeleton className="w-24 h-24 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100" />
      {/* Fields grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <div className="sm:col-span-2 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  );
}
