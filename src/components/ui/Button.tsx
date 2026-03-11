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
                            // Primary: Solid vibrant color
                            'bg-orange-500 text-white shadow-sm hover:shadow-md hover:bg-orange-600 hover:-translate-y-px border-0': variant === 'primary',

                            // Secondary: Clean outline/soft background
                            'bg-slate-50 text-slate-700 dark:bg-dark-surface dark:text-slate-200 border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:border-slate-600': variant === 'secondary',

                            // Danger: Solid Red
                            'bg-red-500 text-white shadow-sm hover:bg-red-600 border-0': variant === 'danger',

                            // Ghost: Clean Text
                            'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-surface hover:text-slate-900 dark:hover:text-slate-200': variant === 'ghost',

                            // Outline: Clean Border
                            'border border-slate-200 dark:border-dark-border bg-transparent text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-dark-surface': variant === 'outline',

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
