import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={twMerge(
                        clsx(
                            'block w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all duration-200 focus:border-orange-500 focus:bg-white dark:focus:bg-dark-card focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-dark-bg',
                            {
                                'border-red-500 focus:border-red-500 focus:ring-red-500/10': error,
                            },
                            className
                        )
                    )}
                    onWheel={(e) => {
                        if (props.type === 'number') {
                            e.currentTarget.blur();
                        }
                    }}
                    {...props}
                />
                {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
