import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    'group relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/5 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] hover:bg-white/80 dark:hover:bg-slate-800/80',
                    className
                )}
                {...props}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative z-10">
                    {props.children}
                </div>
            </div>
        );
    }
);

Card.displayName = 'Card';
