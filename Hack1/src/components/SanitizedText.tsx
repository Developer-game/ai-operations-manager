'use client';

import React from 'react';
import { sanitizeNoEmDash } from '@/lib/sanitizer';

interface SanitizedTextProps {
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SanitizedText
 * Guarantees zero em dashes are rendered in static or dynamic text blocks.
 */
export function SanitizedText({
  children,
  as: Component = 'span',
  className,
  style,
}: SanitizedTextProps) {
  if (typeof children === 'string') {
    return (
      <Component className={className} style={style}>
        {sanitizeNoEmDash(children)}
      </Component>
    );
  }

  return (
    <Component className={className} style={style}>
      {children}
    </Component>
  );
}
