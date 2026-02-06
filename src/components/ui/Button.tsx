import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={twMerge(
                    clsx(
                        'relative overflow-hidden inline-flex items-center justify-center rounded-2xl font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.96]',
                        {
                            // Primary: Dark/Light Mode Inverted (iOS Style) or Gradient
                            'bg-brand-gradient text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 hover:shadow-orange-500/30 dark:shadow-orange-500/10 border-0': variant === 'primary',

                            // Secondary: Soft Glassy Color
                            'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/30': variant === 'secondary',

                            // Danger: Soft Red
                            'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-100 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/30': variant === 'danger',

                            // Ghost: Clean Text
                            'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 backdrop-blur-sm': variant === 'ghost',

                            // Outline: Glassy Border
                            'border-2 border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50': variant === 'outline',

                            'px-4 py-2 text-xs': size === 'sm',
                            'px-6 py-3 text-sm': size === 'md',
                            'px-8 py-4 text-base': size === 'lg',
                        },
                        className
                    )
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
