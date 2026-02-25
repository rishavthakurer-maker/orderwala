'use client';

import { useRef, useEffect } from 'react';

interface DynamicBarProps {
  className?: string;
  height?: string;
  width?: string;
  minHeight?: string;
  minWidth?: string;
  backgroundColor?: string;
}

export function DynamicBar({ className = '', height, width, minHeight, minWidth, backgroundColor }: DynamicBarProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (height) ref.current.style.height = height;
      if (width) ref.current.style.width = width;
      if (minHeight) ref.current.style.minHeight = minHeight;
      if (minWidth) ref.current.style.minWidth = minWidth;
      if (backgroundColor) ref.current.style.backgroundColor = backgroundColor;
    }
  }, [height, width, minHeight, minWidth, backgroundColor]);

  return <div ref={ref} className={className} />;
}
