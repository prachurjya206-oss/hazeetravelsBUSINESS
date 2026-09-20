import type { DailyTransaction } from '../types/transaction';
import type { InvestmentRecord, OwnerInvestmentSummary } from '../types/investment';
import type { GlobalFilterState } from '../types/filter';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  totalInvestment: number;
  operatingDays: number;
  avgDailyIncome: number;
  avgDailyExpense: number;
  avgDailyProfit: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyFinancial {
  monthIndex: number; // 0-11
  monthName: string;
  income: number;
  expense: number;
  profit: number;
  margin: number;
  operatingDays: number;
}

/**
 * Calculate core financial metrics.
 * GUARANTEE: Investments are strictly isolated and DO NOT affect net profit.
 */
export function calculateFinancialSummary(
  transactions: DailyTransaction[],
  investments: InvestmentRecord[]
): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  const activeDates = new Set<string>();

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amount;
    } else if (tx.type === 'expense') {
      totalExpense += amount;
    }
    if (tx.date) {
      activeDates.add(tx.date);
    }
  }

  // Net Profit is strictly Income minus Expense
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Total Investment is separate equity capital
  const totalInvestment = investments.reduce(
    (sum, inv) => sum + (Number(inv.amount) || 0),
    0
  );

  const operatingDays = activeDates.size;
  const avgDailyIncome = operatingDays > 0 ? totalIncome / operatingDays : 0;
  const avgDailyExpense = operatingDays > 0 ? totalExpense / operatingDays : 0;
  const avgDailyProfit = operatingDays > 0 ? netProfit / operatingDays : 0;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin,
    totalInvestment,
    operatingDays,
    avgDailyIncome,
    avgDailyExpense,
    avgDailyProfit,
  };
}

/**
 * Group expenses by category with exact sum and percentage
 */
export function calculateExpenseBreakdown(transactions: DailyTransaction[]): CategoryBreakdown[] {
  const expenseMap = new Map<string, { amount: number; count: number }>();
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      const amount = Number(tx.amount) || 0;
      totalExpense += amount;
      const current = expenseMap.get(tx.category) || { amount: 0, count: 0 };
      expenseMap.set(tx.category, {
        amount: current.amount + amount,
        count: current.count + 1,
      });
    }
  }

  const breakdown: CategoryBreakdown[] = [];
  expenseMap.forEach((val, category) => {
    breakdown.push({
      category,
      amount: val.amount,
      percentage: totalExpense > 0 ? (val.amount / totalExpense) * 100 : 0,
      count: val.count,
    });
  });

  return breakdown.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate month-by-month financial summary for a given year
 */
export function calculateMonthlyFinancials(
  transactions: DailyTransaction[],
  year: number
): MonthlyFinancial[] {
  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const monthsData: { income: number; expense: number; dates: Set<string> }[] = Array.from(
    { length: 12 },
    () => ({ income: 0, expense: 0, dates: new Set<string>() })
  );

  for (const tx of transactions) {
    if (!tx.date) continue;
    const [txYear, txMonth] = tx.date.split('-').map(Number);
    if (txYear === year && txMonth >= 1 && txMonth <= 12) {
      const idx = txMonth - 1;
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        monthsData[idx].income += amount;
      } else if (tx.type === 'expense') {
        monthsData[idx].expense += amount;
      }
      monthsData[idx].dates.add(tx.date);
    }
  }

  return monthsData.map((data, idx) => {
    const profit = data.income - data.expense;
    const margin = data.income > 0 ? (profit / data.income) * 100 : 0;
    return {
      monthIndex: idx,
      monthName: MONTH_NAMES[idx],
      income: data.income,
      expense: data.expense,
      profit,
      margin,
      operatingDays: data.dates.size,
    };
  });
}

/**
 * Calculate investment share per owner
 */
export function calculateOwnerInvestmentSummaries(
  investments: InvestmentRecord[]
): OwnerInvestmentSummary[] {
  const map = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  for (const inv of investments) {
    const owner = (inv.owner || 'Unknown').trim();
    const amount = Number(inv.amount) || 0;
    grandTotal += amount;
    const current = map.get(owner) || { total: 0, count: 0 };
    map.set(owner, {
      total: current.total + amount,
      count: current.count + 1,
    });
  }

  const summaries: OwnerInvestmentSummary[] = [];
  map.forEach((val, owner) => {
    summaries.push({
      owner,
      totalAmount: val.total,
      percentage: grandTotal > 0 ? (val.total / grandTotal) * 100 : 0,
      count: val.count,
    });
  });

  return summaries.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Filter transactions based on active global filter
 */
export function filterTransactionsByGlobalFilter(
  transactions: DailyTransaction[],
  filter: GlobalFilterState
): DailyTransaction[] {
  if (filter.quickFilter === 'all-time') {
    return transactions;
  }

  return transactions.filter((tx) => {
    if (!tx.date) return false;
    return tx.date >= filter.startDate && tx.date <= filter.endDate;
  });
}

/**
 * Filter investments based on active global filter
 */
export function filterInvestmentsByGlobalFilter(
  investments: InvestmentRecord[],
  filter: GlobalFilterState
): InvestmentRecord[] {
  if (filter.quickFilter === 'all-time') {
    return investments;
  }

  return investments.filter((inv) => {
    if (!inv.date) return false;
    return inv.date >= filter.startDate && inv.date <= filter.endDate;
  });
}
