import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#ef4444']; // Net (Green), Insurance (Blue), Tax (Red)

const formatCurrencyShort = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value;
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#fff', margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
                <p style={{ color: '#ccc', margin: 0 }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

const SalaryCharts = ({ data2025, data2026Same, data2026Increased, scenarioName }) => {
    // 1. Prepare Data for Pie Chart (Breakdown of CURRENT selected scenario - default to 2026 increased or passed prop)
    // Let's visualize the "2026 Increased" scenario by default if available, strictly separating flow

    // We will visualize the scenario passed as prop, or use data2026Increased as primary demo
    const activeData = data2026Increased || data2025;

    const pieData = [
        { name: 'Thực nhận (Net)', value: activeData.net },
        { name: 'Bảo hiểm', value: activeData.insurance },
        { name: 'Thuế TNCN', value: activeData.tax },
    ].filter(item => item.value > 0);

    // 2. Prepare Data for Bar Chart (Comparison)
    const barData = [
        {
            name: '2025',
            Gross: data2025.salary,
            Net: data2025.net,
        },
        {
            name: '2026',
            Gross: data2025.salary, // Same Salary
            Net: data2026Same.net,
        },
        {
            name: '2026 (+Sal)',
            Gross: data2026Increased.salary,
            Net: data2026Increased.net,
        },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }} className="chart-grid">
            {/* Pie Chart: Money Flow */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '1.1rem', textAlign: 'center' }}>
                    🍰 Phân bổ lương (2026 +Tăng)
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bar Chart: Comparison */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#6366f1', fontSize: '1.1rem', textAlign: 'center' }}>
                    📊 So sánh Gross vs Net
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={barData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={10}
                                tickFormatter={formatCurrencyShort}
                                tickLine={false}
                                axisLine={false}
                            />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Legend />
                            <Bar dataKey="Gross" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="Net" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SalaryCharts;
