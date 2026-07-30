import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#FF8042'];

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const dashboardRef = useRef(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/partes/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleExportPDF = async () => {
        const element = dashboardRef.current;
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('dashboard-report.pdf');
    };

    if (!stats) return <div className="p-8">Loading stats...</div>;

    const statusData = stats.byStatus.map(item => ({
        name: item._id,
        value: item.count
    }));

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard & Indicators</h2>
                <button
                    onClick={handleExportPDF}
                    className="flex items-center bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded transition"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export PDF
                </button>
            </div>

            <div ref={dashboardRef} className="bg-gray-50 p-4 rounded-xl">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Total Partes</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalPartes}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-secondary">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Total Indicadores</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalPartes}</p> {/* Using total partes as proxy for now */}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Active Users</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">1</p> {/* Placeholder */}
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Partes by Status</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Activity Overview</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#F97316" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-gray-400 text-sm">
                    Generated on {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
