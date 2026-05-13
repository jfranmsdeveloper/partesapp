/* UI Version: 12:30 Baseline */
import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    'group relative glass-card rounded-[2rem] p-8 transition-all duration-200 hover:shadow-lg',
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
