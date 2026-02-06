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
        <div className="group relative flex flex-col p-6 rounded-[2rem] bg-white/60 dark:bg-slate-800/40 backdrop-blur-3xl border border-white/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:scale-[1.02]">
            {/* Soft inner glow gradient */}
            <div className={clsx("absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-white/40 to-transparent dark:from-white/5", currentStyle.bg)} />

            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={clsx("p-3.5 rounded-2xl transition-colors duration-300", currentStyle.iconBg)}>
                    {Icon && <Icon className={clsx("w-6 h-6", currentStyle.icon)} />}
                </div>
                {trend && (
                    <div className={clsx(
                        "flex items-center text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md bg-white/50 dark:bg-slate-700/50 shadow-sm",
                        trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                        {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-auto">
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 pl-1 tracking-wide">{title}</h3>
                <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
            </div>
        </div>
    );
};
