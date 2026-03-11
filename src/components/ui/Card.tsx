import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    'group relative bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-[2rem] p-8 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700/50',
                    className
                )}
                {...props}
            >
                <div className="relative z-10">
                    {props.children}
                </div>
            </div>
        );
    }
);

Card.displayName = 'Card';
