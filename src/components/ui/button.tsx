import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-amber-700 shadow-sm',
        secondary:
          'bg-stone-100 text-stone-900 hover:bg-stone-200 border border-stone-200',
        outline:
          'border border-border bg-transparent hover:bg-stone-50 text-foreground',
        ghost:
          'hover:bg-stone-100 hover:text-stone-900 text-foreground',
        destructive:
          'bg-destructive text-white hover:bg-red-700 shadow-sm',
        accent:
          'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200',
      },
      size: {
        default: 'h-11 px-5 py-2.5 rounded-2xl text-sm min-w-[44px]',
        sm: 'h-9 px-3.5 rounded-xl text-xs min-w-[36px]',
        lg: 'h-13 px-8 rounded-2xl text-base font-semibold min-w-[52px]',
        icon: 'h-11 w-11 rounded-2xl p-0',
        pill: 'h-11 px-6 rounded-full text-sm font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Memproses...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
