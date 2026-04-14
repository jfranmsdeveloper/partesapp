/* UI Version: 12:30 Baseline */
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: any;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'rose' | 'indigo';
}

export const KPICard = ({ title, value, trend, icon: Icon, color = 'blue' }: KPICardProps) => {
    // iOS 26 Pastel Palette configuration
    const styles = {
        blue: {
            bg: 'bg-blue-50/50 dark:bg-blue-900/10',
            iconBg: 'bg-blue-100 dark:bg-blue-500/20',
            icon: 'text-blue-500 dark:text-blue-300',
            trend: 'text-blue-600 dark:text-blue-400'
        },
        green: {
            bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
            iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
            icon: 'text-emerald-500 dark:text-emerald-300',
            trend: 'text-emerald-600 dark:text-emerald-400'
        },
        purple: {
            bg: 'bg-purple-50/50 dark:bg-purple-900/10',
            iconBg: 'bg-purple-100 dark:bg-purple-500/20',
            icon: 'text-purple-500 dark:text-purple-300',
            trend: 'text-purple-600 dark:text-purple-400'
        },
        orange: {
            bg: 'bg-orange-50/50 dark:bg-orange-900/10',
            iconBg: 'bg-orange-100 dark:bg-orange-500/20',
            icon: 'text-orange-500 dark:text-orange-300',
            trend: 'text-orange-600 dark:text-orange-400'
        },
        rose: {
            bg: 'bg-rose-50/50 dark:bg-rose-900/10',
            iconBg: 'bg-rose-100 dark:bg-rose-500/20',
            icon: 'text-rose-500 dark:text-rose-300',
            trend: 'text-rose-600 dark:text-rose-400'
        },
        indigo: {
            bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
            iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
            icon: 'text-indigo-500 dark:text-indigo-300',
            trend: 'text-indigo-600 dark:text-indigo-400'
        },
    };

    const currentStyle = styles[color as keyof typeof styles] || styles.blue;

    return (
        <div className="group flex flex-col p-6 rounded-[2rem] bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow duration-200">

            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={clsx("p-3.5 rounded-2xl transition-colors duration-300", currentStyle.iconBg)}>
                    {Icon && <Icon className={clsx("w-6 h-6", currentStyle.icon)} />}
                </div>
                {trend && (
                    <div className={clsx(
                        "flex items-center text-xs font-bold px-3 py-1.5 rounded-full shadow-sm",
                        trend.isPositive ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10"
                    )}>
                        {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-auto">
                <p className="text-[32px] font-bold text-slate-800 dark:text-white/90 tracking-tight leading-none mb-2">{value}</p>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</h3>
            </div>
        </div>
    );
};
