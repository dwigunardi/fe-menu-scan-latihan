import { forwardRef, LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 select-none block mb-1.5', className)}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';
