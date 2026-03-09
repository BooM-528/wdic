'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          'rounded-2xl font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/40',

          // size
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-5 py-3 text-base': size === 'md',
            'px-6 py-4 text-lg': size === 'lg',
          },

          // variant (normal)
          !disabled && {
            'bg-primary text-white hover:opacity-90 shadow-md':
              variant === 'primary',

            'bg-white text-secondary-dark border border-gray-200 hover:bg-gray-50':
              variant === 'secondary',

            'bg-transparent text-secondary-dark hover:bg-gray-100':
              variant === 'ghost',
          },

          // disabled (override ทุก variant)
          disabled && [
            'opacity-50 cursor-not-allowed',
            'bg-gray-200 text-gray-400 shadow-none',
            'hover:opacity-50 hover:bg-gray-200',
          ],

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
