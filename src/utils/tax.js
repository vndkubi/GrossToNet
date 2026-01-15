
export const SALARY_CONFIG = {
  REGION_MIN_WAGE: 4960000, // Region 1
  BASE_SALARY: 2340000,
  INSURANCE_RATES: {
    BHXH: 0.08,
    BHYT: 0.015,
    BHTN: 0.01,
  },
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const calculateInsurance = (grossSalary, customBaseSalary = null, customRegionMinWage = null, insuranceSalary = null) => {
  const baseSalary = customBaseSalary || SALARY_CONFIG.BASE_SALARY;
  const regionMinWage = customRegionMinWage || SALARY_CONFIG.REGION_MIN_WAGE;

  // Use custom insurance salary if provided, otherwise use gross salary
  const salaryBase = insuranceSalary !== null ? insuranceSalary : grossSalary;

  const capBHXH = 20 * baseSalary;
  const capBHTN = 20 * regionMinWage;

  const salaryForBHXH = Math.min(salaryBase, capBHXH);
  const salaryForBHTN = Math.min(salaryBase, capBHTN);

  const bhxh = salaryForBHXH * SALARY_CONFIG.INSURANCE_RATES.BHXH;
  const bhyt = salaryForBHXH * SALARY_CONFIG.INSURANCE_RATES.BHYT;
  const bhtn = salaryForBHTN * SALARY_CONFIG.INSURANCE_RATES.BHTN;

  return { bhxh, bhyt, bhtn, total: bhxh + bhyt + bhtn, capBHXH, capBHTN, salaryBase };
};

const calculatePIT = (taxableIncome, brackets, rates) => {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let previousLimit = 0;

  for (let i = 0; i < brackets.length; i++) {
    const limit = brackets[i] * 1000000;
    const rate = rates[i];

    // Limits inside the loop usually define the UPPER bound of the bracket
    // Wait, typical bracket structure:
    // 0-5 => 5m taxable
    // 5-10 => next 5m
    // My inputs define thresholds.
    // Logic:

    // If tax income > current entry limit, tax full bracket range
    // If tax income is within current bracket, tax the remainder

    // Example definition: [5, 10, 18...] means:
    // Branch 1: 0 to 5
    // Branch 2: 5 to 10

    // Algorithm:
    // Loop through brackets. 
    // Current bracket width = (Limit - PreviousLimit).
    // Taxable Amount in this bracket = Math.min(TaxableIncome - PreviousLimit, Width).
    // If Taxable Amount < 0, break.
    // Tax += Taxable Amount * Rate.
    // PreviousLimit = Limit.
    // Handle last bracket (Infinity).

    const currentLimit = (brackets[i] === Infinity) ? Infinity : brackets[i] * 1000000;

    if (taxableIncome > previousLimit) {
      const taxableAmount = Math.min(taxableIncome, currentLimit) - previousLimit;
      if (taxableAmount > 0) {
        tax += taxableAmount * rate;
      }
    }
    previousLimit = currentLimit;
  }

  return tax;
};

export const calculateTax2025 = (incomeBeforeTax, dependents) => {
  const PERSONAL_RELIEF = 11000000;
  const DEPENDENT_RELIEF = 4400000;

  const taxableIncome = incomeBeforeTax - PERSONAL_RELIEF - (dependents * DEPENDENT_RELIEF);

  // Brackets 2025: 5, 10, 18, 32, 52, 80, Infinity
  const brackets = [5, 10, 18, 32, 52, 80, Infinity];
  const rates = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35];

  return calculatePIT(taxableIncome, brackets, rates);
};

export const calculateTax2026 = (incomeBeforeTax, dependents) => {
  const PERSONAL_RELIEF = 15500000;
  const DEPENDENT_RELIEF = 6200000;

  const taxableIncome = incomeBeforeTax - PERSONAL_RELIEF - (dependents * DEPENDENT_RELIEF);

  // Brackets 2026: 10, 30, 60, 100, Infinity
  const brackets = [10, 30, 60, 100, Infinity];
  const rates = [0.05, 0.10, 0.20, 0.30, 0.35];

  return calculatePIT(taxableIncome, brackets, rates);
};
