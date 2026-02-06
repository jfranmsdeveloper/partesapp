import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DataItem {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface StatusDistributionChartProps {
    data: DataItem[];
}

export const StatusDistributionChart = ({ data }: StatusDistributionChartProps) => {
    // Calculate total for center text
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 border border-white/20 dark:border-white/10 shadow-xl rounded-2xl text-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                        <p className="font-bold text-slate-800 dark:text-slate-100">{payload[0].name}</p>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {payload[0].value} <span className="text-xs opacity-70">registros</span>
                        <span className="ml-2 font-bold text-slate-700 dark:text-slate-300">
                            ({((payload[0].value / total) * 100).toFixed(0)}%)
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // If no data, show placeholder
    if (data.every(d => d.value === 0)) {
        return (
            <div className="h-full w-full flex items-center justify-center text-slate-400/60 font-medium italic">
                Sin datos registrados
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={6}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="hover:opacity-80 transition-opacity duration-300 cursor-pointer stroke-white dark:stroke-slate-900 stroke-2"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        content={({ payload }) => (
                            <div className="flex justify-center gap-4 mt-4">
                                {payload?.map((entry: any, index: number) => (
                                    <div key={`legend-${index}`} className="flex items-center gap-1.5">
                                        <div
                                            className="w-2 h-2 rounded-full ring-2 ring-white/20 dark:ring-white/5"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            {entry.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    />

                    {/* Centered Labels using dy offsets for cleaner vertical rhythm */}
                    <text
                        x="50%"
                        y="50%"
                        dy={-5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-800 dark:fill-white text-5xl md:text-6xl font-black tracking-tighter"
                        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}
                    >
                        {total}
                    </text>
                    <text
                        x="50%"
                        y="50%"
                        dy={30}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-400 dark:fill-slate-500 text-xs md:text-sm font-bold tracking-[0.2em] uppercase"
                    >
                        {total === 1 ? 'Parte' : 'Partes'}
                    </text>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
