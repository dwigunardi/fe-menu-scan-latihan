import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 text-sm text-foreground placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
