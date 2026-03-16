import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../hooks/useTheme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DataItem {
    date: string; // ISO date or formatted
    count: number;
}

interface TrendChartProps {
    data: DataItem[];
}

export const TrendChart = ({ data }: TrendChartProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl text-sm">
                    <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {format(new Date(label), "d MMM yyyy", { locale: es })}
                    </p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-black">
                        {payload[0].value} <span className="text-xs font-medium opacity-70 uppercase tracking-tighter ml-1">Actuaciones</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#ffffff' : '#f1f5f9'} opacity={0.1} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), "d MMM", { locale: es })}
                        tick={{ fontSize: 9, fill: '#ffffff', opacity: 0.7, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        hide
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#ffffff"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
