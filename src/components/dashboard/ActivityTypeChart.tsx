import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface DataItem {
    name: string;
    count: number;
}

interface ActivityTypeChartProps {
    data: DataItem[];
}

export const ActivityTypeChart = ({ data }: ActivityTypeChartProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Sort by count desc
    const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 7); // Top 7

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl text-sm">
                    <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-black">
                        {payload[0].value} <span className="text-xs font-medium opacity-70 uppercase tracking-tighter ml-1">Registros</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} opacity={0.2} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 10, fontWeight: 700, fill: isDark ? '#94a3b8' : '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)' }} content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={20} fill="url(#barGradient)">
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
