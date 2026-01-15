
import React, { useState, useEffect } from 'react';
import { calculateInsurance, calculateTax2025, calculateTax2026, formatCurrency, SALARY_CONFIG } from '../utils/tax';
import SalaryCharts from './SalaryCharts';
import BudgetPlanner from './BudgetPlanner';

// Helper to format number with thousand separators for display
const formatInputDisplay = (value) => {
    if (value === 0 || value === '') return '';
    return new Intl.NumberFormat('vi-VN').format(value);
};

// Helper to parse formatted string back to number
const parseInputValue = (str) => {
    if (!str) return 0;
    // Remove all non-digit characters
    const cleaned = str.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
};

const TaxCalculator = () => {
    const [salary, setSalary] = useState(30000000);
    const [salaryDisplay, setSalaryDisplay] = useState(formatInputDisplay(30000000));
    const [allowance, setAllowance] = useState(0);
    const [allowanceDisplay, setAllowanceDisplay] = useState('');
    const [dependents, setDependents] = useState(0);
    const [salaryIncreasePercent, setSalaryIncreasePercent] = useState(10);

    // Annual package
    const [month13, setMonth13] = useState(1); // Number of 13th month salaries (default 1)
    const [bonus, setBonus] = useState(0);
    const [bonusDisplay, setBonusDisplay] = useState('');

    // Advanced settings
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [baseSalary, setBaseSalary] = useState(SALARY_CONFIG.BASE_SALARY);
    const [baseSalaryDisplay, setBaseSalaryDisplay] = useState(formatInputDisplay(SALARY_CONFIG.BASE_SALARY));
    const [regionMinWage, setRegionMinWage] = useState(SALARY_CONFIG.REGION_MIN_WAGE);
    const [regionMinWageDisplay, setRegionMinWageDisplay] = useState(formatInputDisplay(SALARY_CONFIG.REGION_MIN_WAGE));

    // Custom insurance salary (when company declares different salary for BHXH)
    const [useCustomInsuranceSalary, setUseCustomInsuranceSalary] = useState(false);
    const [insuranceSalary, setInsuranceSalary] = useState(0);
    const [insuranceSalaryDisplay, setInsuranceSalaryDisplay] = useState('');

    const [results, setResults] = useState(null);

    const handleSalaryChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = parseInputValue(rawValue);
        setSalary(numericValue);
        setSalaryDisplay(formatInputDisplay(numericValue));
    };

    const handleAllowanceChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = parseInputValue(rawValue);
        setAllowance(numericValue);
        setAllowanceDisplay(formatInputDisplay(numericValue));
    };

    const handleBaseSalaryChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = parseInputValue(rawValue);
        setBaseSalary(numericValue);
        setBaseSalaryDisplay(formatInputDisplay(numericValue));
    };

    const handleRegionMinWageChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = parseInputValue(rawValue);
        setRegionMinWage(numericValue);
        setRegionMinWageDisplay(formatInputDisplay(numericValue));
    };

    const handleInsuranceSalaryChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = parseInputValue(rawValue);
        setInsuranceSalary(numericValue);
        setInsuranceSalaryDisplay(formatInputDisplay(numericValue));
    };

    const handleBonusChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = parseInputValue(rawValue);
        setBonus(numericValue);
        setBonusDisplay(formatInputDisplay(numericValue));
    };

    // Calculate annual package (12 months net + 13th month net + bonus net)
    // Calculate annual package with Tax Settlement (Quyết toán)
    const calculateAnnualPackage = (monthlyNet, monthlySalary, monthlyAllowance, monthlyInsurance, monthlyTax, calcTaxFunc) => {
        const month13Gross = monthlySalary * month13;

        // --- 1. ESTIMATE TAX PAID (TEMPORARY) ---
        // Assumption: Pay monthly tax for 11 months. 
        // Dec (or bonus month): Income = Monthly + T13 + Bonus. 
        // Tax withheld in bonus month is calculated on the total huge income of that month.

        const incomeBeforeTaxMonthly = (monthlySalary + monthlyAllowance) - monthlyInsurance;
        // Total taxable income in the "Bonus Month" (assuming relief is deducted once in calcTaxFunc)
        const incomeTotalBonusMonth = incomeBeforeTaxMonthly + month13Gross + bonus;

        const taxNormalMonth = monthlyTax;
        const taxBonusMonth = calcTaxFunc(incomeTotalBonusMonth, dependents);

        const totalTaxPaid = (taxNormalMonth * 11) + taxBonusMonth;

        // Calculate Net for Bonus/Month13 based on marginal tax allocation for display
        // This represents the "Cashflow Net" received at that time
        const taxOnExtra = taxBonusMonth - taxNormalMonth;
        const totalExtraGross = month13Gross + bonus;

        let month13Net = 0;
        let bonusNet = 0;

        if (totalExtraGross > 0) {
            const taxForMonth13 = taxOnExtra * (month13Gross / totalExtraGross);
            const taxForBonus = taxOnExtra * (bonus / totalExtraGross);

            month13Net = month13Gross - taxForMonth13;
            bonusNet = bonus - taxForBonus;
        }

        // --- 2. FINALIZATION (QUYẾT TOÁN) ---
        // Calculate tax based on Average Monthly Income for the whole year
        const annualGross = ((monthlySalary + monthlyAllowance) * 12) + month13Gross + bonus;
        const annualInsurance = monthlyInsurance * 12; // Bonus no insurance
        const annualTaxableIncomeRaw = annualGross - annualInsurance;

        // Average monthly taxable income equivalent
        const avgMonthlyIncomeBeforeTax = annualTaxableIncomeRaw / 12;

        // Correct annual tax obligation
        const avgMonthlyTax = calcTaxFunc(avgMonthlyIncomeBeforeTax, dependents);
        const finalTaxObligation = avgMonthlyTax * 12;

        // --- 3. SETTLEMENT ---
        const settlement = totalTaxPaid - finalTaxObligation; // > 0: Refund, < 0: Pay more

        // Annual Net (True Net after settlement)
        const annualNet = annualGross - annualInsurance - finalTaxObligation;

        return {
            annualNet,
            annualGross,
            finalTaxObligation,
            totalTaxPaid,
            settlement,
            month13Net,
            bonusNet
        };
    };

    const calculate = () => {
        // Determine insurance salary (use custom if enabled, otherwise use gross)
        const effectiveInsuranceSalary = useCustomInsuranceSalary && insuranceSalary > 0 ? insuranceSalary : null;

        // ===== CURRENT YEAR (2025) with current salary =====
        const insurance2025 = calculateInsurance(salary, baseSalary, regionMinWage, effectiveInsuranceSalary);
        const totalIncome2025 = salary + allowance;
        const incomeBeforeTax2025 = totalIncome2025 - insurance2025.total;
        const tax2025 = calculateTax2025(incomeBeforeTax2025, dependents);
        const net2025 = totalIncome2025 - insurance2025.total - tax2025;

        // ===== NEXT YEAR (2026) with same salary (to compare law changes only) =====
        const insurance2026Same = calculateInsurance(salary, baseSalary, regionMinWage, effectiveInsuranceSalary);
        const totalIncome2026Same = salary + allowance;
        const incomeBeforeTax2026Same = totalIncome2026Same - insurance2026Same.total;
        const tax2026Same = calculateTax2026(incomeBeforeTax2026Same, dependents);
        const net2026Same = totalIncome2026Same - insurance2026Same.total - tax2026Same;

        // ===== NEXT YEAR (2026) with increased salary =====
        const increasedSalary = salary * (1 + salaryIncreasePercent / 100);
        const increasedAllowance = allowance * (1 + salaryIncreasePercent / 100);
        const increasedInsuranceSalary = effectiveInsuranceSalary ? effectiveInsuranceSalary * (1 + salaryIncreasePercent / 100) : null;
        const insurance2026Increased = calculateInsurance(increasedSalary, baseSalary, regionMinWage, increasedInsuranceSalary);
        const totalIncome2026Increased = increasedSalary + increasedAllowance;
        const incomeBeforeTax2026Increased = totalIncome2026Increased - insurance2026Increased.total;
        const tax2026Increased = calculateTax2026(incomeBeforeTax2026Increased, dependents);
        const net2026Increased = totalIncome2026Increased - insurance2026Increased.total - tax2026Increased;

        setResults({
            insuranceCaps: {
                capBHXH: insurance2025.capBHXH,
                capBHTN: insurance2025.capBHTN
            },
            data2025: {
                salary: salary,
                allowance: allowance,
                insurance: insurance2025.total,
                tax: tax2025,
                net: net2025,
                annual: calculateAnnualPackage(net2025, salary, allowance, insurance2025.total, tax2025, calculateTax2025)
            },
            data2026Same: {
                salary: salary,
                allowance: allowance,
                insurance: insurance2026Same.total,
                tax: tax2026Same,
                net: net2026Same,
                annual: calculateAnnualPackage(net2026Same, salary, allowance, insurance2026Same.total, tax2026Same, calculateTax2026)
            },
            data2026Increased: {
                salary: increasedSalary,
                allowance: increasedAllowance,
                insurance: insurance2026Increased.total,
                tax: tax2026Increased,
                net: net2026Increased,
                annual: calculateAnnualPackage(net2026Increased, increasedSalary, increasedAllowance, insurance2026Increased.total, tax2026Increased, calculateTax2026)
            }
        });
    };

    useEffect(() => {
        calculate();
    }, [salary, allowance, dependents, salaryIncreasePercent, baseSalary, regionMinWage, useCustomInsuranceSalary, insuranceSalary, month13, bonus]);

    // Differences
    const diffNetLawOnly = results ? results.data2026Same.net - results.data2025.net : 0;
    const diffNetWithRaise = results ? results.data2026Increased.net - results.data2025.net : 0;

    return (
        <div className="glass-panel animate-fade-in">
            <h1 className="title">Vietnam PIT Comparison</h1>
            <p className="subtitle">So sánh Lương Net 2025 vs 2026</p>

            {/* Input Section */}
            <div className="input-grid-2">
                <div className="input-group">
                    <label className="label">Lương Gross hiện tại</label>
                    <input
                        type="text"
                        value={salaryDisplay}
                        onChange={handleSalaryChange}
                        className="input"
                        placeholder="VD: 30.000.000"
                    />
                </div>

                <div className="input-group">
                    <label className="label">Phụ cấp (chịu thuế)</label>
                    <input
                        type="text"
                        value={allowanceDisplay}
                        onChange={handleAllowanceChange}
                        className="input"
                        placeholder="VD: 2.000.000"
                    />
                </div>

                <div className="input-group">
                    <label className="label">Người phụ thuộc</label>
                    <input
                        type="number"
                        value={dependents}
                        onChange={(e) => setDependents(Number(e.target.value))}
                        className="input"
                        min="0"
                    />
                </div>

                <div className="input-group">
                    <label className="label">Dự kiến tăng lương 2026 (%)</label>
                    <input
                        type="number"
                        value={salaryIncreasePercent}
                        onChange={(e) => setSalaryIncreasePercent(Number(e.target.value))}
                        className="input"
                        min="0"
                        max="100"
                        style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}
                    />
                </div>
            </div>

            {/* Annual Package Section */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.5rem',
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '0.95rem' }}>
                    🎁 Package năm (Thưởng + Tháng 13)
                </h4>
                <div className="input-grid-2">
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="label">
                            Số tháng lương 13
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                VD: 1 = 1 tháng lương, 2 = 2 tháng...
                            </span>
                        </label>
                        <input
                            type="number"
                            value={month13}
                            onChange={(e) => setMonth13(Number(e.target.value))}
                            className="input"
                            min="0"
                            max="12"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="label">
                            Thưởng năm (Gross)
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                Thưởng KPI, thưởng Tết...
                            </span>
                        </label>
                        <input
                            type="text"
                            value={bonusDisplay}
                            onChange={handleBonusChange}
                            className="input"
                            placeholder="VD: 50.000.000"
                            style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        />
                    </div>
                </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div style={{ marginTop: '1rem' }}>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#94a3b8',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ⚙️ Tùy chỉnh lương cơ sở đóng bảo hiểm
                    <span style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </button>
            </div>

            {/* Advanced Settings Panel */}
            {showAdvanced && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                        🏛️ Cấu hình đóng bảo hiểm
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">
                                Lương cơ sở (BHXH, BHYT)
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                    Trần = 20× = {formatCurrency(baseSalary * 20)}
                                </span>
                            </label>
                            <input
                                type="text"
                                value={baseSalaryDisplay}
                                onChange={handleBaseSalaryChange}
                                className="input"
                                placeholder="2.340.000"
                                style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">
                                Lương tối thiểu vùng (BHTN)
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                    Trần = 20× = {formatCurrency(regionMinWage * 20)}
                                </span>
                            </label>
                            <input
                                type="text"
                                value={regionMinWageDisplay}
                                onChange={handleRegionMinWageChange}
                                className="input"
                                placeholder="4.960.000"
                                style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                            />
                        </div>
                    </div>

                    {/* Quick select region */}
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#64748b', fontSize: '0.85rem', marginRight: '0.5rem' }}>Vùng:</span>
                        {[
                            { label: 'Vùng 1', wage: 4960000 },
                            { label: 'Vùng 2', wage: 4410000 },
                            { label: 'Vùng 3', wage: 3860000 },
                            { label: 'Vùng 4', wage: 3450000 }
                        ].map((region) => (
                            <button
                                key={region.label}
                                onClick={() => {
                                    setRegionMinWage(region.wage);
                                    setRegionMinWageDisplay(formatInputDisplay(region.wage));
                                }}
                                style={{
                                    background: regionMinWage === region.wage ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    color: regionMinWage === region.wage ? '#a5b4fc' : '#94a3b8',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {region.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Insurance Salary Section */}
                    <div style={{
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="useCustomInsurance"
                                checked={useCustomInsuranceSalary}
                                onChange={(e) => setUseCustomInsuranceSalary(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="useCustomInsurance" style={{ color: '#e2e8f0', cursor: 'pointer', fontSize: '0.95rem' }}>
                                💼 Công ty đóng BHXH trên mức lương khác
                            </label>
                        </div>

                        {useCustomInsuranceSalary && (
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label">
                                    Mức lương đóng BHXH
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                        VD: Công ty chỉ đóng BH trên 6 triệu thay vì lương thực
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={insuranceSalaryDisplay}
                                    onChange={handleInsuranceSalaryChange}
                                    className="input"
                                    placeholder="VD: 6.000.000"
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        borderColor: 'rgba(245, 158, 11, 0.4)',
                                        maxWidth: '300px'
                                    }}
                                />
                                {insuranceSalary > 0 && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                                        ⚠️ BH sẽ tính trên {formatCurrency(insuranceSalary)} thay vì lương Gross
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {results && (
                <>
                    {/* Comparison Grid - 3 columns */}
                    <div className="results-grid-3">

                        {/* 2025 Card */}
                        <div className="result-card" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                            <div className="result-header">
                                <span>2025</span>
                                <span className="vs-badge">Hiện tại</span>
                            </div>
                            <div className="row">
                                <span>Lương Gross</span>
                                <span>{formatCurrency(results.data2025.salary)}</span>
                            </div>
                            <div className="row">
                                <span>Phụ cấp</span>
                                <span>{formatCurrency(results.data2025.allowance)}</span>
                            </div>
                            <div className="row">
                                <span>Bảo hiểm (10.5%)</span>
                                <span>{formatCurrency(results.data2025.insurance)}</span>
                            </div>
                            <div className="row">
                                <span>Giảm trừ BT</span>
                                <span>11.000.000 ₫</span>
                            </div>
                            <div className="row">
                                <span>Giảm trừ NPT ({dependents})</span>
                                <span>{formatCurrency(dependents * 4400000)}</span>
                            </div>
                            <div className="row">
                                <span>Thuế TNCN</span>
                                <span style={{ color: '#f87171' }}>{formatCurrency(results.data2025.tax)}</span>
                            </div>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <span className="label">Lương Net</span>
                                <div className="amount">{formatCurrency(results.data2025.net)}</div>
                            </div>
                        </div>

                        {/* 2026 Same Salary Card */}
                        <div className="result-card" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.03)' }}>
                            <div className="result-header">
                                <span>2026</span>
                                <span className="vs-badge" style={{ background: '#3b82f6', color: 'white' }}>Không tăng lương</span>
                            </div>
                            <div className="row">
                                <span>Lương Gross</span>
                                <span>{formatCurrency(results.data2026Same.salary)}</span>
                            </div>
                            <div className="row">
                                <span>Phụ cấp</span>
                                <span>{formatCurrency(results.data2026Same.allowance)}</span>
                            </div>
                            <div className="row">
                                <span>Bảo hiểm (10.5%)</span>
                                <span>{formatCurrency(results.data2026Same.insurance)}</span>
                            </div>
                            <div className="row">
                                <span>Giảm trừ BT</span>
                                <span style={{ color: '#3b82f6' }}>15.500.000 ₫</span>
                            </div>
                            <div className="row">
                                <span>Giảm trừ NPT ({dependents})</span>
                                <span style={{ color: '#3b82f6' }}>{formatCurrency(dependents * 6200000)}</span>
                            </div>
                            <div className="row">
                                <span>Thuế TNCN</span>
                                <span style={{ color: '#2dd4bf' }}>{formatCurrency(results.data2026Same.tax)}</span>
                            </div>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <span className="label">Lương Net</span>
                                <div className="amount" style={{ color: '#3b82f6' }}>{formatCurrency(results.data2026Same.net)}</div>
                                {diffNetLawOnly > 0 && (
                                    <div style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        ✨ +{formatCurrency(diffNetLawOnly)}/tháng
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2026 With Raise Card */}
                        <div className="result-card" style={{ borderColor: 'rgba(168, 85, 247, 0.5)', background: 'rgba(168, 85, 247, 0.05)' }}>
                            <div className="result-header">
                                <span>2026</span>
                                <span className="vs-badge" style={{ background: '#a855f7', color: 'white' }}>+{salaryIncreasePercent}% lương</span>
                            </div>
                            <div className="row">
                                <span>Lương Gross</span>
                                <span style={{ color: '#a855f7' }}>{formatCurrency(results.data2026Increased.salary)}</span>
                            </div>
                            <div className="row">
                                <span>Phụ cấp</span>
                                <span style={{ color: '#a855f7' }}>{formatCurrency(results.data2026Increased.allowance)}</span>
                            </div>
                            <div className="row">
                                <span>Bảo hiểm (10.5%)</span>
                                <span>{formatCurrency(results.data2026Increased.insurance)}</span>
                            </div>
                            <div className="row">
                                <span>Giảm trừ BT</span>
                                <span style={{ color: '#a855f7' }}>15.500.000 ₫</span>
                            </div>
                            <div className="row">
                                <span>Giảm trừ NPT ({dependents})</span>
                                <span style={{ color: '#a855f7' }}>{formatCurrency(dependents * 6200000)}</span>
                            </div>
                            <div className="row">
                                <span>Thuế TNCN</span>
                                <span style={{ color: '#2dd4bf' }}>{formatCurrency(results.data2026Increased.tax)}</span>
                            </div>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <span className="label">Lương Net</span>
                                <div className="amount highlight">{formatCurrency(results.data2026Increased.net)}</div>
                                {diffNetWithRaise > 0 && (
                                    <div style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        🎉 +{formatCurrency(diffNetWithRaise)}/tháng so với 2025
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Comparison */}
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#10b981', fontSize: '1.1rem' }}>📊 Tổng kết so sánh (Tháng)</h3>
                        <div className="summary-grid-2">
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Chỉ thay đổi luật (không tăng lương)</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: diffNetLawOnly > 0 ? '#10b981' : '#f87171' }}>
                                    {diffNetLawOnly >= 0 ? '+' : ''}{formatCurrency(diffNetLawOnly)}/tháng
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                    = {formatCurrency(diffNetLawOnly * 12)}/năm
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Luật mới + Tăng {salaryIncreasePercent}% lương</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: diffNetWithRaise > 0 ? '#10b981' : '#f87171' }}>
                                    {diffNetWithRaise >= 0 ? '+' : ''}{formatCurrency(diffNetWithRaise)}/tháng
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                    = {formatCurrency(diffNetWithRaise * 12)}/năm
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <SalaryCharts
                        data2025={results.data2025}
                        data2026Same={results.data2026Same}
                        data2026Increased={results.data2026Increased}
                    />

                    {/* Annual Package Summary */}
                    <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '1.1rem' }}>🎁 Package năm (bao gồm Tháng 13 + Thưởng)</h3>
                        <div className="annual-grid-3">
                            {/* 2025 Annual */}
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ color: '#a5b4fc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>2025</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e2e8f0' }}>
                                    {formatCurrency(results.data2025.annual.annualNet)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                    12 tháng: {formatCurrency(results.data2025.net * 12)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    Tháng 13 ({month13}): {formatCurrency(results.data2025.annual.month13Net)}
                                </div>
                                {bonus > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        Thưởng: {formatCurrency(results.data2025.annual.bonusNet)}
                                    </div>
                                )}
                                {/* Settlement 2025 */}
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Quyết toán thuế:</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: results.data2025.annual.settlement >= 0 ? '#10b981' : '#f87171' }}>
                                        {results.data2025.annual.settlement >= 0 ? 'Được hoàn: ' : 'Đóng thêm: '}
                                        {formatCurrency(Math.abs(results.data2025.annual.settlement))}
                                    </div>
                                </div>
                            </div>

                            {/* 2026 Same Annual */}
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ color: '#60a5fa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>2026 (không tăng)</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#60a5fa' }}>
                                    {formatCurrency(results.data2026Same.annual.annualNet)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                    12 tháng: {formatCurrency(results.data2026Same.net * 12)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    Tháng 13 ({month13}): {formatCurrency(results.data2026Same.annual.month13Net)}
                                </div>
                                {bonus > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        Thưởng: {formatCurrency(results.data2026Same.annual.bonusNet)}
                                    </div>
                                )}
                                <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
                                    +{formatCurrency(results.data2026Same.annual.annualNet - results.data2025.annual.annualNet)}/năm
                                </div>
                                {/* Settlement 2026 Same */}
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(59, 130, 246, 0.2)' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Quyết toán thuế:</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: results.data2026Same.annual.settlement >= 0 ? '#10b981' : '#f87171' }}>
                                        {results.data2026Same.annual.settlement >= 0 ? 'Được hoàn: ' : 'Đóng thêm: '}
                                        {formatCurrency(Math.abs(results.data2026Same.annual.settlement))}
                                    </div>
                                </div>
                            </div>

                            {/* 2026 Increased Annual */}
                            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ color: '#c084fc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>2026 (+{salaryIncreasePercent}%)</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#a855f7' }}>
                                    {formatCurrency(results.data2026Increased.annual.annualNet)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                    12 tháng: {formatCurrency(results.data2026Increased.net * 12)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    Tháng 13 ({month13}): {formatCurrency(results.data2026Increased.annual.month13Net)}
                                </div>
                                {bonus > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        Thưởng: {formatCurrency(results.data2026Increased.annual.bonusNet)}
                                    </div>
                                )}
                                <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
                                    🎉 +{formatCurrency(results.data2026Increased.annual.annualNet - results.data2025.annual.annualNet)}/năm
                                </div>
                                {/* Settlement 2026 Increased */}
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(168, 85, 247, 0.2)' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Quyết toán thuế:</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: results.data2026Increased.annual.settlement >= 0 ? '#10b981' : '#f87171' }}>
                                        {results.data2026Increased.annual.settlement >= 0 ? 'Được hoàn: ' : 'Đóng thêm: '}
                                        {formatCurrency(Math.abs(results.data2026Increased.annual.settlement))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Budget Planner - Showing stats for 2026 Increased as default */}
                    <BudgetPlanner
                        monthlyNet={results.data2026Increased.net}
                        annualBonusNet={(results.data2026Increased.annual.month13Net || 0) + (results.data2026Increased.annual.bonusNet || 0)}
                        salaryIncreasePercent={salaryIncreasePercent}
                    />
                </>
            )}
        </div>
    );
};

export default TaxCalculator;
