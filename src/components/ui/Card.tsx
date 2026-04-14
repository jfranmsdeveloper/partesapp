import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    'glass-card rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1',
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
