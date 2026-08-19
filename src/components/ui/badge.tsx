import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        bestseller: 'bg-amber-500 text-white shadow-xs',
        recommended: 'bg-emerald-600 text-white shadow-xs',
        rating: 'bg-amber-50 text-amber-900 border border-amber-200/80',
        paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        preparing: 'bg-blue-50 text-blue-700 border border-blue-200',
        served: 'bg-emerald-600 text-white',
        outofstock: 'bg-red-50 text-red-700 border border-red-200',
        destructive: 'bg-red-500 text-white',
        secondary: 'bg-stone-100 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200',
        neutral: 'bg-stone-100 text-stone-700 border border-stone-200',
        outline: 'border border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
