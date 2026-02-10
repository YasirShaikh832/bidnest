'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';

const PALETTE = [
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-fuchsia-500',
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

export function Avatar({
  src,
  name,
  email,
  className,
  size = 'md',
}: {
  src?: string | null;
  name?: string | null;
  email?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const fallback = name?.slice(0, 2).toUpperCase() || email?.slice(0, 2).toUpperCase() || '?';
  const seed = (name || email || 'default');
  const bgClass = PALETTE[hash(seed) % PALETTE.length];
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm';

  const imgSrc = src && (src.startsWith('http') ? src : `${API_URL}${src}`);
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizeClass,
        bgClass,
        className
      )}
    >
      {fallback}
    </div>
  );
}
