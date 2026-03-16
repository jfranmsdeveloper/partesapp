import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface DataItem {
    name: string;
    duration: number;
}

interface TimePerClientChartProps {
    data: DataItem[];
}

export const TimePerClientChart = ({ data }: TimePerClientChartProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Sort by duration desc and take top 10
    const sortedData = [...data].sort((a, b) => b.duration - a.duration).slice(0, 10);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl text-sm">
                    <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
                    <p className="text-orange-500 font-black">
                        {payload[0].value} <span className="text-xs font-medium opacity-70 uppercase tracking-tighter ml-1 text-slate-500">minutos invertidos</span>
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
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                    layout="vertical"
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 10, fontWeight: 700, fill: isDark ? '#94a3b8' : '#64748b' }}
                        width={120}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)' }} />
                    <Bar 
                        dataKey="duration" 
                        radius={[0, 12, 12, 0]} 
                        barSize={24}
                        animationDuration={1500}
                    >
                        {sortedData.map((_entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} 
                                fillOpacity={1 - (index * 0.08)}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
