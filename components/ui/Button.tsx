'use client';

import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

/**
 * Shared button with built-in loading state.
 * Uses .btn CSS classes — no new styles.
 * loading=true disables the button and shows an inline spinner alongside the label.
 */
export default function Button({
  variant = 'ghost',
  size,
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button {...props} className={cls} disabled={disabled || loading}>
      {loading && (
        <span
          className="spinner spinner-dark"
          style={{ width: 13, height: 13, flexShrink: 0 }}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
