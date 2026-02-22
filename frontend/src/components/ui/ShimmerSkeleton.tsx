import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-xl bg-muted animate-pulse',
      className
    )}
    {...props}
  >
    <div
      className="absolute inset-0 w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10"
    />
  </div>
);

export default ShimmerSkeleton;
