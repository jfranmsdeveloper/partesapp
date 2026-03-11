import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge = ({ className, variant = 'neutral', ...props }: BadgeProps) => {
    return (
        <span
            className={twMerge(
                clsx(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    {
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': variant === 'success',
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20': variant === 'warning',
                        'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20': variant === 'danger',
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20': variant === 'info',
                        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20': variant === 'neutral',
                    },
                    className
                )
            )}
            {...props}
        />
    );
};
