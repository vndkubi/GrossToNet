import React, { useState } from 'react';

const BudgetPlanner = ({ monthlyNet, annualBonusNet, salaryIncreasePercent }) => {
    // Default expenses
    const [expenses, setExpenses] = useState([
        { id: 1, name: 'Nhà ở', value: 5000000 },
        { id: 2, name: 'Ăn uống', value: 4000000 },
        { id: 3, name: 'Di chuyển', value: 1000000 },
    ]);

    const [newItemName, setNewItemName] = useState('');
    const [newItemValue, setNewItemValue] = useState(''); // Store as formatted string for display
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper: 123456 -> "123.456"
    const formatNumber = (num) => {
        if (!num) return '';
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    // Helper: "123.456" -> 123456
    const parseNumber = (str) => {
        if (!str) return 0;
        // Remove dots and commas
        return Number(str.replace(/\./g, '').replace(/,/g, ''));
    };

    const handleAddExpense = () => {
        const rawValue = parseNumber(newItemValue);
        if (!newItemName || !rawValue) return;

        const newItem = {
            id: Date.now(),
            name: newItemName,
            value: rawValue
        };

        setExpenses([...expenses, newItem]);
        setNewItemName('');
        setNewItemValue('');
    };

    const handleRemoveExpense = (id) => {
        setExpenses(expenses.filter(item => item.id !== id));
    };

    const handleUpdateExpense = (id, newDisplayValue) => {
        // Allow user to type, update state with numeric value
        const numericValue = parseNumber(newDisplayValue);
        setExpenses(expenses.map(item =>
            item.id === id ? { ...item, value: numericValue } : item
        ));
    };

    const totalExpense = expenses.reduce((sum, item) => sum + item.value, 0);
    const monthlySavings = monthlyNet - totalExpense;

    // Annual Savings = 12 months savings + Bonus Net
    const annualSavings = (monthlySavings * 12) + annualBonusNet;

    // Projection for 5 years
    const projection5Years = annualSavings * 5;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

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
                            Dư hàng tháng: <span style={{ color: monthlySavings > 0 ? '#10b981' : '#f87171' }}>{formatCurrency(monthlySavings)}</span>
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

                    <div className="input-grid-2">
                        {/* Expense Inputs */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 1rem', color: '#cbd5e1' }}>💸 Chi phí hàng tháng</h4>

                            {/* Add New Item */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Tên khoản chi..."
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="input"
                                    style={{ flex: 2, fontSize: '0.9rem', padding: '0.5rem' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Số tiền..."
                                    value={newItemValue}
                                    onChange={(e) => {
                                        // User logic: user types digits, we format immediately
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        setNewItemValue(formatNumber(raw));
                                    }}
                                    className="input"
                                    style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
                                />
                                <button
                                    onClick={handleAddExpense}
                                    className="btn"
                                    style={{ width: 'auto', padding: '0.5rem 1rem', background: '#10b981' }}
                                >
                                    +
                                </button>
                            </div>

                            {/* Expense List */}
                            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {expenses.map((item) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
                                        <span style={{ color: '#e2e8f0', fontSize: '0.9rem', flex: 1 }}>{item.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={formatNumber(item.value)}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                                    handleUpdateExpense(item.id, raw);
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#fff',
                                                    textAlign: 'right',
                                                    width: '90px',
                                                    fontSize: '0.9rem',
                                                    outline: 'none'
                                                }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>₫</span>
                                            <button
                                                onClick={() => handleRemoveExpense(item.id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem' }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>Tổng chi:</span>
                                <span style={{ color: '#f87171' }}>{formatCurrency(totalExpense)}</span>
                            </div>
                        </div>

                        {/* Savings Summary */}
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h4 style={{ margin: '0 0 1rem', color: '#10b981' }}>🐷 Heo đất của bạn</h4>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Dư hàng tháng</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: monthlySavings > 0 ? '#10b981' : '#f87171' }}>
                                    {formatCurrency(monthlySavings)}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Dư 1 năm (12 tháng + Thưởng)</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {formatCurrency(annualSavings)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    (Bao gồm net tháng 13 & thưởng)
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Sau 5 năm (giữ nguyên mức này)</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#a855f7' }}>
                                    {formatCurrency(projection5Years)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetPlanner;
