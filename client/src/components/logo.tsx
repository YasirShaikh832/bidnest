'use client';

import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/logo.png"
      alt="BidNest"
      className={cn('object-contain', className)}
      {...props}
    />
  );
}
