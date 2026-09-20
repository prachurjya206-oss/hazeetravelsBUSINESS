export type QuickFilterType =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'this-year'
  | 'all-time'
  | 'custom';

export interface GlobalFilterState {
  quickFilter: QuickFilterType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  selectedYear: number;
  selectedMonth: number; // 1-12
}

export interface TransactionFilterState {
  searchQuery: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export interface InvestmentFilterState {
  searchQuery: string;
  owner: string;
  selectedYear: number | 'all';
  selectedMonth: number | 'all';
  startDate: string;
  endDate: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}
