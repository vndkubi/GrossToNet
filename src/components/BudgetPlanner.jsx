import React, { useState } from 'react';

const BudgetPlanner = ({ data2025, data2026Same, data2026Increased }) => {
    // Default expenses
    const [expenses, setExpenses] = useState([
        { id: 1, name: 'Nhà ở', value: 5000000 },
        { id: 2, name: 'Ăn uống', value: 4000000 },
        { id: 3, name: 'Di chuyển', value: 1000000 },
    ]);

    const [newItemName, setNewItemName] = useState('');
    const [newItemValue, setNewItemValue] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Helpers
    const formatNumber = (num) => (!num ? '' : new Intl.NumberFormat('vi-VN').format(num));
    const parseNumber = (str) => (!str ? 0 : Number(str.replace(/\./g, '').replace(/,/g, '')));
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const handleAddExpense = () => {
        const rawValue = parseNumber(newItemValue);
        if (!newItemName || !rawValue) return;
        setExpenses([...expenses, { id: Date.now(), name: newItemName, value: rawValue }]);
        setNewItemName('');
        setNewItemValue('');
    };

    const handleRemoveExpense = (id) => setExpenses(expenses.filter(item => item.id !== id));

    const handleUpdateExpense = (id, newDisplayValue) => {
        const numericValue = parseNumber(newDisplayValue);
        setExpenses(expenses.map(item => item.id === id ? { ...item, value: numericValue } : item));
    };

    const totalExpense = expenses.reduce((sum, item) => sum + item.value, 0);

    // Helper to calculate savings for a specific scenario
    const calculateSavings = (data) => {
        const monthlySavings = data.net - totalExpense;
        // Annual Savings = 12 * Monthly Savings + Month13 Net + Bonus Net
        // Note: data.annual.month13Net/bonusNet might be undefined if 0 inputs, handle safely
        const m13 = data.annual.month13Net || 0;
        const bn = data.annual.bonusNet || 0;
        const annualSavings = (monthlySavings * 12) + m13 + bn;
        return { monthlySavings, annualSavings };
    };

    const stats2025 = calculateSavings(data2025);
    const stats2026Same = calculateSavings(data2026Same);
    const stats2026Increased = calculateSavings(data2026Increased);

    return (
        <div style={{ marginTop: '2rem' }} className="glass-panel">
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h3 style={{ margin: 0, color: '#ec4899', fontSize: '1.2rem' }}>💰 Kế hoạch dòng tiền & Tiết kiệm</h3>
                    {!isExpanded && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                            Dư 2026 (Tăng lương): <span style={{ color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(stats2026Increased.monthlySavings)}/tháng</span>
                        </p>
                    )}
                </div>
                <button
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}
                >
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {isExpanded && (
                <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.5s ease' }}>

                    {/* Expense Section (Full Width) */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                        <h4 style={{ margin: '0 0 1rem', color: '#cbd5e1' }}>💸 Nhập Chi phí hàng tháng (Dùng chung)</h4>

                        {/* Add New Item */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Tên khoản chi..."
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="input"
                                style={{ flex: 2, minWidth: '120px' }}
                            />
                            <input
                                type="text"
                                placeholder="Số tiền..."
                                value={newItemValue}
                                onChange={(e) => setNewItemValue(formatNumber(e.target.value.replace(/[^0-9]/g, '')))}
                                className="input"
                                style={{ flex: 1, minWidth: '100px' }}
                            />
                            <button onClick={handleAddExpense} className="btn" style={{ width: 'auto', background: '#10b981' }}>+</button>
                        </div>

                        {/* Expense List */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {expenses.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <span style={{ color: '#e2e8f0' }}>{item.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={formatNumber(item.value)}
                                            onChange={(e) => handleUpdateExpense(item.id, e.target.value.replace(/[^0-9]/g, ''))}
                                            style={{ background: 'transparent', border: 'none', color: '#fff', textAlign: 'right', width: '90px', outline: 'none' }}
                                        />
                                        <span style={{ color: '#94a3b8' }}>₫</span>
                                        <button onClick={() => handleRemoveExpense(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            <span>Tổng chi tiêu tháng:</span>
                            <span style={{ color: '#f87171' }}>{formatCurrency(totalExpense)}</span>
                        </div>
                    </div>

                    {/* Savings Comparison Grid (3 Columns) */}
                    <h4 style={{ margin: '0 0 1rem', color: '#10b981', textAlign: 'center' }}>📊 So sánh Tiết kiệm (Heo đất)</h4>
                    <div className="results-grid-3">
                        {/* 2025 */}
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                            <div style={{ color: '#a5b4fc', fontSize: '0.9rem', marginBottom: '0.5rem', textAlign: 'center' }}>2025 (Hiện tại)</div>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dư tháng</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: stats2025.monthlySavings > 0 ? '#10b981' : '#f87171' }}>
                                    {formatCurrency(stats2025.monthlySavings)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dư 1 năm</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e2e8f0' }}>
                                    {formatCurrency(stats2025.annualSavings)}
                                </div>
                            </div>
                        </div>

                        {/* 2026 Same */}
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ color: '#60a5fa', fontSize: '0.9rem', marginBottom: '0.5rem', textAlign: 'center' }}>2026 (Không tăng)</div>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dư tháng</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: stats2026Same.monthlySavings > 0 ? '#10b981' : '#f87171' }}>
                                    {formatCurrency(stats2026Same.monthlySavings)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dư 1 năm</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e2e8f0' }}>
                                    {formatCurrency(stats2026Same.annualSavings)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>
                                    +{formatCurrency(stats2026Same.annualSavings - stats2025.annualSavings)}
                                </div>
                            </div>
                        </div>

                        {/* 2026 Increased */}
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                            <div style={{ color: '#c084fc', fontSize: '0.9rem', marginBottom: '0.5rem', textAlign: 'center' }}>2026 (+Tăng lương)</div>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dư tháng</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: stats2026Increased.monthlySavings > 0 ? '#10b981' : '#f87171' }}>
                                    {formatCurrency(stats2026Increased.monthlySavings)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dư 1 năm</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#c084fc' }}>
                                    {formatCurrency(stats2026Increased.annualSavings)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>
                                    +{formatCurrency(stats2026Increased.annualSavings - stats2025.annualSavings)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        * Dư 1 năm = (Dư tháng × 12) + Lương tháng 13 (Net) + Thưởng (Net)
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetPlanner;
