import React, { useState, useEffect } from 'react';

// Default Interest Rates (Annual % based on common products)
const BANK_RATES = {
    TPBank: 36, // ~3% month
    UOB: 30,    // ~2.5% month
    ACB: 28,    // ~2.3% month
    Other: 30
};

const DebtManager = ({ monthlyNet }) => {
    const [activeTab, setActiveTab] = useState('credit'); // credit, installment, loan

    // --- 1. Credit Cards ---
    const [cards, setCards] = useState([
        { id: 1, bank: 'TPBank', balance: 10000000, limit: 50000000, rate: BANK_RATES.TPBank },
        { id: 2, bank: 'UOB', balance: 5000000, limit: 30000000, rate: BANK_RATES.UOB },
    ]);
    const [newCard, setNewCard] = useState({ bank: 'ACB', balance: '', limit: '', rate: BANK_RATES.ACB });

    // --- 2. Installments (Trả góp) ---
    const [installments, setInstallments] = useState([
        { id: 1, name: 'iPhone 16', monthlyAmount: 2500000, monthsLeft: 6 },
    ]);
    const [newInstallment, setNewInstallment] = useState({ name: '', monthlyAmount: '', monthsLeft: '' });

    // --- 3. Loans (Vay vốn) ---
    const [loans, setLoans] = useState([
        {
            id: 1,
            name: 'Mua nhà',
            principal: 1000000000, // 1 tỷ
            termYears: 20,
            ratePref: 7.5, // Preferential rate 
            monthsPref: 12,
            rateFloat: 11, // Floating rate
            startDate: new Date().toISOString().split('T')[0]
        }
    ]);
    const [newLoan, setNewLoan] = useState({
        name: '', principal: '', termYears: '', ratePref: '', monthsPref: '', rateFloat: '', startDate: new Date().toISOString().split('T')[0]
    });

    // Helpers
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatNumber = (num) => (!num ? '' : new Intl.NumberFormat('vi-VN').format(num));
    const parseNumber = (str) => (!str ? 0 : Number(String(str).replace(/\./g, '').replace(/,/g, '')));

    // --- CREDIT CARD LOGIC ---
    const addCard = () => {
        if (!newCard.balance) return;
        setCards([...cards, { ...newCard, id: Date.now(), balance: parseNumber(newCard.balance), limit: parseNumber(newCard.limit) }]);
        setNewCard({ ...newCard, balance: '', limit: '' });
    };
    const removeCard = (id) => setCards(cards.filter(c => c.id !== id));

    const totalCreditDebt = cards.reduce((sum, c) => sum + c.balance, 0);
    const totalMinPay = cards.reduce((sum, c) => sum + (c.balance * 0.05), 0); // Estimate min pay 5%
    const estimatedInterest = cards.reduce((sum, c) => sum + (c.balance * (c.rate / 100 / 12)), 0); // Monthly interest estimate

    // --- INSTALLMENT LOGIC ---
    const addInstallment = () => {
        if (!newInstallment.name || !newInstallment.monthlyAmount) return;
        setInstallments([...installments, {
            id: Date.now(),
            name: newInstallment.name,
            monthlyAmount: parseNumber(newInstallment.monthlyAmount),
            monthsLeft: Number(newInstallment.monthsLeft)
        }]);
        setNewInstallment({ name: '', monthlyAmount: '', monthsLeft: '' });
    };
    const removeInstallment = (id) => setInstallments(installments.filter(i => i.id !== id));

    // Calculate Debt Free Date for Installments
    const maxMonths = installments.reduce((max, i) => Math.max(max, i.monthsLeft), 0);
    const dateFreeInstallment = new Date();
    dateFreeInstallment.setMonth(dateFreeInstallment.getMonth() + maxMonths);
    const totalInstallmentMonthly = installments.reduce((sum, i) => sum + i.monthlyAmount, 0);

    // --- LOAN LOGIC (Revised Reducing Balance) ---
    const calculateLoanSchedule = (loan) => {
        // Simple calculation for NEXT month payment
        // Real amortization is complex, here we estimate current monthly payment based on current phase
        // Assume loan started recently for simplicity in this version, or user inputs start date.
        // Let's assume we are at Month 1 for calculation or average.

        // Actually, let's calculate the standard schedule logic
        const totalMonths = loan.termYears * 12;
        const principalPerMonth = loan.principal / totalMonths;

        // Check if we are in preferential period
        // For simplicity in UI summary, we show payment for "Month 1" (Max payment) or "Average"
        // Let's show: First Month Payment (Max Stress)

        const rateCurrentMonthly = (loan.ratePref / 100) / 12;
        const interestMonth1 = loan.principal * rateCurrentMonthly;
        const payMonth1 = principalPerMonth + interestMonth1;

        // Post-preferential estimation
        const principalRemainingAfterPref = loan.principal - (principalPerMonth * loan.monthsPref);
        const rateFloatMonthly = (loan.rateFloat / 100) / 12;
        const interestPostPref = principalRemainingAfterPref * rateFloatMonthly;
        const payPostPref = principalPerMonth + interestPostPref;

        return { payMonth1, payPostPref, interestMonth1 };
    };

    const loanSummary = loans.map(loan => ({ ...loan, ...calculateLoanSchedule(loan) }));
    const totalLoanMonthly = loanSummary.reduce((sum, l) => sum + l.payMonth1, 0);

    // --- GRAND TOTAL ---
    const totalMonthlyObligation = totalMinPay + totalInstallmentMonthly + totalLoanMonthly;
    const remainingCashflow = monthlyNet - totalMonthlyObligation;

    return (
        <div style={{ marginTop: '2rem' }} className="glass-panel">
            <h3 style={{ margin: '0 0 1.5rem', color: '#f43f5e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💳 Quản lý Nợ & Dòng tiền
            </h3>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['credit', 'installment', 'loan'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === tab ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === tab ? '#f43f5e' : '#94a3b8',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        {tab === 'credit' ? 'Thẻ Tín Dụng' : tab === 'installment' ? 'Trả Góp' : 'Vay Vốn'}
                    </button>
                ))}
            </div>

            {/* CONTENT: CREDIT CARDS */}
            {activeTab === 'credit' && (
                <div className="animate-fade-in">
                    <div className="input-grid-2" style={{ marginBottom: '1rem' }}>
                        <select
                            className="input"
                            value={newCard.bank}
                            onChange={(e) => setNewCard({ ...newCard, bank: e.target.value, rate: BANK_RATES[e.target.value] || 30 })}
                        >
                            <option value="TPBank">TPBank (36%/năm)</option>
                            <option value="UOB">UOB (30%/năm)</option>
                            <option value="ACB">ACB (28%/năm)</option>
                            <option value="Other">Khác</option>
                        </select>
                        <input
                            className="input"
                            placeholder="Dư nợ (VND)..."
                            value={formatNumber(newCard.balance)}
                            onChange={(e) => setNewCard({ ...newCard, balance: e.target.value.replace(/[^0-9]/g, '') })}
                        />
                        <input
                            className="input"
                            placeholder="Hạn mức (VND)..."
                            value={formatNumber(newCard.limit)}
                            onChange={(e) => setNewCard({ ...newCard, limit: e.target.value.replace(/[^0-9]/g, '') })}
                        />
                        <button className="btn" onClick={addCard}>+ Thêm Thẻ</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {cards.map(card => (
                            <div key={card.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{card.bank} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({card.rate}%)</span></div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Hạn mức: {formatCurrency(card.limit)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#f43f5e', fontWeight: 'bold' }}>{formatCurrency(card.balance)}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                                        Lãi dự kiến: {formatCurrency(card.balance * (card.rate / 100 / 12))}
                                    </div>
                                </div>
                                <button onClick={() => removeCard(card.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '0.5rem' }}>×</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTENT: INSTALLMENTS */}
            {activeTab === 'installment' && (
                <div className="animate-fade-in">
                    <div className="input-grid-2" style={{ marginBottom: '1rem' }}>
                        <input className="input" placeholder="Tên món (iphone...)" value={newInstallment.name} onChange={e => setNewInstallment({ ...newInstallment, name: e.target.value })} />
                        <input className="input" placeholder="Trả mỗi tháng..." value={formatNumber(newInstallment.monthlyAmount)} onChange={e => setNewInstallment({ ...newInstallment, monthlyAmount: e.target.value.replace(/[^0-9]/g, '') })} />
                        <input className="input" placeholder="Số tháng còn lại..." value={newInstallment.monthsLeft} onChange={e => setNewInstallment({ ...newInstallment, monthsLeft: e.target.value })} />
                        <button className="btn" onClick={addInstallment}>+ Thêm</button>
                    </div>

                    {installments.map(item => (
                        <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ color: '#e2e8f0' }}>{item.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Còn {item.monthsLeft} tháng</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#f43f5e' }}>{formatCurrency(item.monthlyAmount)}/tháng</div>
                                <button onClick={() => removeInstallment(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                            </div>
                        </div>
                    ))}

                    {installments.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: '#10b981' }}>🎉 Bạn sẽ sạch nợ trả góp vào:</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                                Tháng {dateFreeInstallment.getMonth() + 1}/{dateFreeInstallment.getFullYear()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CONTENT: LOANS */}
            {activeTab === 'loan' && (
                <div className="animate-fade-in">
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                        <h4 style={{ margin: '0 0 1rem', color: '#cbd5e1' }}>Thêm khoản vay mới</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <input className="input" placeholder="Tên (Nhà/Xe)" value={newLoan.name} onChange={e => setNewLoan({ ...newLoan, name: e.target.value })} />
                            <input className="input" placeholder="Số tiền vay (Gốc)" value={formatNumber(newLoan.principal)} onChange={e => setNewLoan({ ...newLoan, principal: e.target.value.replace(/[^0-9]/g, '') })} />
                            <input className="input" placeholder="Thời hạn (Năm)" value={newLoan.termYears} onChange={e => setNewLoan({ ...newLoan, termYears: e.target.value })} />
                            <input className="input" placeholder="Lãi ưu đãi (%/năm)" value={newLoan.ratePref} onChange={e => setNewLoan({ ...newLoan, ratePref: e.target.value })} />
                            <input className="input" placeholder="Tháng ưu đãi (12/24...)" value={newLoan.monthsPref} onChange={e => setNewLoan({ ...newLoan, monthsPref: e.target.value })} />
                            <input className="input" placeholder="Lãi thả nổi (%/năm)" value={newLoan.rateFloat} onChange={e => setNewLoan({ ...newLoan, rateFloat: e.target.value })} />
                        </div>
                        <button className="btn" style={{ marginTop: '1rem' }} onClick={() => {
                            if (!newLoan.name) return;
                            setLoans([...loans, { ...newLoan, id: Date.now(), principal: parseNumber(newLoan.principal), termYears: Number(newLoan.termYears), ratePref: Number(newLoan.ratePref), monthsPref: Number(newLoan.monthsPref), rateFloat: Number(newLoan.rateFloat) }]);
                        }}>+ Thêm Khoản Vay</button>
                    </div>

                    {loanSummary.map(loan => (
                        <div key={loan.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong style={{ color: '#e2e8f0', fontSize: '1.1rem' }}>{loan.name}</strong>
                                <span style={{ color: '#94a3b8' }}>{formatCurrency(loan.principal)} / {loan.termYears} năm</span>
                            </div>
                            <div className="input-grid-2">
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>Giai đoạn ưu đãi ({loan.monthsPref} tháng)</div>
                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{loan.ratePref}%/năm</div>
                                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginTop: '0.25rem' }}>Trả: {formatCurrency(loan.payMonth1)}/tháng</div>
                                </div>
                                <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#fda4af' }}>Giai đoạn thả nổi (Sau ưu đãi)</div>
                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{loan.rateFloat}%/năm</div>
                                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginTop: '0.25rem' }}>Trả: ~{formatCurrency(loan.payPostPref)}/tháng</div>
                                </div>
                            </div>
                            <button onClick={() => setLoans(loans.filter(l => l.id !== loan.id))} style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Xóa khoản vay</button>
                        </div>
                    ))}
                </div>
            )}

            {/* DASHBOARD SUMMARY */}
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ margin: '0 0 1rem', color: '#38bdf8', textAlign: 'center' }}>📊 Tổng kết Dòng Tiền Hàng Tháng</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                    <span>Thu nhập Net (2026 Tăng):</span>
                    <span style={{ color: '#10b981' }}>{formatCurrency(monthlyNet)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                    <span>Tổng nợ phải trả/tháng:</span>
                    <span style={{ color: '#f43f5e' }}>- {formatCurrency(totalMonthlyObligation)}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span>Còn lại (Trước chi tiêu):</span>
                    <span style={{ color: remainingCashflow > 0 ? '#38bdf8' : '#f43f5e' }}>{formatCurrency(remainingCashflow)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
                    *Thẻ tín dụng tính thanh toán tối thiểu 5%
                </div>
            </div>
        </div>
    );
};

export default DebtManager;
