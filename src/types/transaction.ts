export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Fuel'
  | 'Driver/Helper'
  | 'Maintenance'
  | 'Repair'
  | 'Toll'
  | 'Food'
  | 'Other';

export type IncomeCategory = 'Daily Collection' | 'Special Trip' | 'Other Income';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface DailyTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  category: string;
  description?: string | null;
  notes?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface TransactionFormData {
  date: string;
  type: TransactionType;
  amount: number | string;
  category: string;
  description: string;
  notes: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Fuel',
  'Driver/Helper',
  'Maintenance',
  'Repair',
  'Toll',
  'Food',
  'Other',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Daily Collection',
  'Special Trip',
  'Other Income',
];
