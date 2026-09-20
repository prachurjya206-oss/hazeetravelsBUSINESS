import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { turso, isDatabaseConnected, ensureTursoSchema } from '../lib/turso';
import type { DailyTransaction, TransactionFormData, TransactionType } from '../types/transaction';
import type { InvestmentRecord, InvestmentFormData } from '../types/investment';
import type { GlobalFilterState, QuickFilterType } from '../types/filter';
import {
  calculateFinancialSummary,
  calculateExpenseBreakdown,
  calculateMonthlyFinancials,
  calculateOwnerInvestmentSummaries,
  filterTransactionsByGlobalFilter,
  filterInvestmentsByGlobalFilter,
} from '../lib/calculations';
import type {
  FinancialSummary,
  CategoryBreakdown,
  MonthlyFinancial,
} from '../lib/calculations';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Raw Data
  transactions: DailyTransaction[];
  investments: InvestmentRecord[];
  loading: boolean;
  error: string | null;

  // Filtered Data based on active global filter
  filteredTransactions: DailyTransaction[];
  filteredInvestments: InvestmentRecord[];

  // Computed Summaries
  summary: FinancialSummary;
  categoryBreakdown: CategoryBreakdown[];
  monthlyFinancials: MonthlyFinancial[];
  ownerInvestments: ReturnType<typeof calculateOwnerInvestmentSummaries>;

  // Global Filter State & Actions
  globalFilter: GlobalFilterState;
  setGlobalFilter: React.Dispatch<React.SetStateAction<GlobalFilterState>>;
  setQuickFilter: (type: QuickFilterType) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  setYearFilter: (year: number) => void;
  setMonthFilter: (month: number) => void;

  // CRUD for Transactions
  addTransaction: (data: TransactionFormData) => Promise<{ error: Error | null }>;
  updateTransaction: (id: string, data: TransactionFormData) => Promise<{ error: Error | null }>;
  deleteTransaction: (id: string) => Promise<{ error: Error | null }>;
  bulkImportTransactions: (records: Omit<DailyTransaction, 'id'>[]) => Promise<{ count: number; error: Error | null }>;

  // CRUD for Investments
  addInvestment: (data: InvestmentFormData) => Promise<{ error: Error | null }>;
  updateInvestment: (id: string, data: InvestmentFormData) => Promise<{ error: Error | null }>;
  deleteInvestment: (id: string) => Promise<{ error: Error | null }>;
  bulkImportInvestments: (records: Omit<InvestmentRecord, 'id'>[]) => Promise<{ count: number; error: Error | null }>;

  // Refresh
  refreshData: () => Promise<void>;
  clearAllLocalData: () => Promise<void>;
  loadSampleDemoData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper for initial global filter date ranges
function computeInitialFilter(): GlobalFilterState {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Default to 'this-month' for quick relevant bus bookkeeping
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return {
    quickFilter: 'this-month',
    startDate: firstDay,
    endDate: endOfMonth,
    selectedYear: year,
    selectedMonth: month,
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeOwnerName } = useAuth();
  const isLive = isDatabaseConnected();

  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState<GlobalFilterState>(computeInitialFilter);

  // Fetch from Turso or local fallback
  const fetchData = useCallback(async () => {
    if (!isLive || !turso) {
      const savedTx = localStorage.getItem('leyland_local_transactions');
      const savedInv = localStorage.getItem('leyland_local_investments');
      setTransactions(savedTx ? JSON.parse(savedTx) : []);
      setInvestments(savedInv ? JSON.parse(savedInv) : []);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await ensureTursoSchema();

      // Fetch transactions from Turso
      const txRes = await turso.execute('SELECT * FROM daily_transactions ORDER BY date DESC, created_at DESC');
      const loadedTxs: DailyTransaction[] = txRes.rows.map((r) => ({
        id: String(r.id),
        date: String(r.date),
        type: String(r.type) as TransactionType,
        amount: Number(r.amount),
        category: String(r.category),
        description: r.description ? String(r.description) : null,
        notes: r.notes ? String(r.notes) : null,
        created_at: r.created_at ? String(r.created_at) : undefined,
        created_by: r.created_by ? String(r.created_by) : null,
      }));

      // Fetch investments from Turso
      const invRes = await turso.execute('SELECT * FROM investments ORDER BY date DESC, created_at DESC');
      const loadedInvs: InvestmentRecord[] = invRes.rows.map((r) => ({
        id: String(r.id),
        date: String(r.date),
        owner: String(r.owner),
        amount: Number(r.amount),
        description: r.description ? String(r.description) : null,
        notes: r.notes ? String(r.notes) : null,
        created_at: r.created_at ? String(r.created_at) : undefined,
        created_by: r.created_by ? String(r.created_by) : null,
      }));

      setTransactions(loadedTxs);
      setInvestments(loadedInvs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch financial data from Turso';
      setError(msg);
      console.error('Turso fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isLive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quick Filter Handler
  const setQuickFilter = (type: QuickFilterType) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${year}-${pad(month)}-${pad(day)}`;

    let start = todayStr;
    let end = todayStr;

    switch (type) {
      case 'today':
        start = todayStr;
        end = todayStr;
        break;
      case 'this-week': {
        const d = new Date(now);
        const dayOfWeek = d.getDay();
        const diffToMonday = d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        const monday = new Date(d.setDate(diffToMonday));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
        end = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
        break;
      }
      case 'this-month': {
        start = `${year}-${pad(month)}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        end = `${year}-${pad(month)}-${pad(lastDay)}`;
        break;
      }
      case 'this-year': {
        start = `${year}-01-01`;
        end = `${year}-12-31`;
        break;
      }
      case 'all-time': {
        start = '1970-01-01';
        end = '2099-12-31';
        break;
      }
      case 'custom':
        setGlobalFilter((prev) => ({ ...prev, quickFilter: 'custom' }));
        return;
    }

    setGlobalFilter({
      quickFilter: type,
      startDate: start,
      endDate: end,
      selectedYear: year,
      selectedMonth: month,
    });
  };

  const setDateRange = (startDate: string, endDate: string) => {
    setGlobalFilter((prev) => ({
      ...prev,
      quickFilter: 'custom',
      startDate,
      endDate,
    }));
  };

  const setYearFilter = (selectedYear: number) => {
    setGlobalFilter((prev) => ({
      ...prev,
      selectedYear,
      quickFilter: 'custom',
      startDate: `${selectedYear}-01-01`,
      endDate: `${selectedYear}-12-31`,
    }));
  };

  const setMonthFilter = (selectedMonth: number) => {
    setGlobalFilter((prev) => {
      const year = prev.selectedYear;
      const pad = (n: number) => String(n).padStart(2, '0');
      const lastDay = new Date(year, selectedMonth, 0).getDate();
      return {
        ...prev,
        selectedMonth,
        quickFilter: 'custom',
        startDate: `${year}-${pad(selectedMonth)}-01`,
        endDate: `${year}-${pad(selectedMonth)}-${pad(lastDay)}`,
      };
    });
  };

  // Filtered subsets
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByGlobalFilter(transactions, globalFilter);
  }, [transactions, globalFilter]);

  const filteredInvestments = useMemo(() => {
    return filterInvestmentsByGlobalFilter(investments, globalFilter);
  }, [investments, globalFilter]);

  // Metrics
  const summary = useMemo(() => {
    return calculateFinancialSummary(filteredTransactions, investments);
  }, [filteredTransactions, investments]);

  const categoryBreakdown = useMemo(() => {
    return calculateExpenseBreakdown(filteredTransactions);
  }, [filteredTransactions]);

  const monthlyFinancials = useMemo(() => {
    return calculateMonthlyFinancials(transactions, globalFilter.selectedYear);
  }, [transactions, globalFilter.selectedYear]);

  const ownerInvestments = useMemo(() => {
    return calculateOwnerInvestmentSummaries(investments);
  }, [investments]);

  // Transaction CRUD
  const addTransaction = async (data: TransactionFormData): Promise<{ error: Error | null }> => {
    const amountNum = Number(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { error: new Error('Amount must be a positive number greater than 0') };
    }
    if (!data.date) {
      return { error: new Error('Date is required') };
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isLive && turso) {
      try {
        await turso.execute({
          sql: `INSERT INTO daily_transactions (id, date, type, amount, category, description, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            id,
            data.date,
            data.type,
            amountNum,
            data.category,
            data.description ? data.description.trim() : null,
            data.notes ? data.notes.trim() : null,
            activeOwnerName,
          ],
        });

        const newTx: DailyTransaction = {
          id,
          date: data.date,
          type: data.type,
          amount: amountNum,
          category: data.category,
          description: data.description ? data.description.trim() : null,
          notes: data.notes ? data.notes.trim() : null,
          created_at: new Date().toISOString(),
          created_by: activeOwnerName,
        };

        setTransactions((prev) => [newTx, ...prev]);
        return { error: null };
      } catch (err: unknown) {
        return { error: err as Error };
      }
    } else {
      const newTx: DailyTransaction = {
        id,
        date: data.date,
        type: data.type,
        amount: amountNum,
        category: data.category,
        description: data.description ? data.description.trim() : null,
        notes: data.notes ? data.notes.trim() : null,
        created_at: new Date().toISOString(),
        created_by: activeOwnerName,
      };
      setTransactions((prev) => [newTx, ...prev]);
      localStorage.setItem('leyland_local_transactions', JSON.stringify([newTx, ...transactions]));
      return { error: null };
    }
  };

  const updateTransaction = async (id: string, data: TransactionFormData): Promise<{ error: Error | null }> => {
    const amountNum = Number(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { error: new Error('Amount must be a positive number') };
    }

    if (isLive && turso) {
      try {
        await turso.execute({
          sql: `UPDATE daily_transactions
                SET date = ?, type = ?, amount = ?, category = ?, description = ?, notes = ?
                WHERE id = ?`,
          args: [
            data.date,
            data.type,
            amountNum,
            data.category,
            data.description ? data.description.trim() : null,
            data.notes ? data.notes.trim() : null,
            id,
          ],
        });

        setTransactions((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  date: data.date,
                  type: data.type,
                  amount: amountNum,
                  category: data.category,
                  description: data.description ? data.description.trim() : null,
                  notes: data.notes ? data.notes.trim() : null,
                }
              : t
          )
        );
        return { error: null };
      } catch (err: unknown) {
        return { error: err as Error };
      }
    } else {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                date: data.date,
                type: data.type,
                amount: amountNum,
                category: data.category,
                description: data.description ? data.description.trim() : null,
                notes: data.notes ? data.notes.trim() : null,
              }
            : t
        )
      );
      return { error: null };
    }
  };

  const deleteTransaction = async (id: string): Promise<{ error: Error | null }> => {
    if (isLive && turso) {
      try {
        await turso.execute({
          sql: `DELETE FROM daily_transactions WHERE id = ?`,
          args: [id],
        });
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        return { error: null };
      } catch (err: unknown) {
        return { error: err as Error };
      }
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return { error: null };
    }
  };

  const bulkImportTransactions = async (
    records: Omit<DailyTransaction, 'id'>[]
  ): Promise<{ count: number; error: Error | null }> => {
    if (isLive && turso) {
      try {
        const statements = records.map((r, i) => {
          const id = `import-tx-${Date.now()}-${i}`;
          return {
            sql: `INSERT INTO daily_transactions (id, date, type, amount, category, description, notes, created_by)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              r.date,
              r.type,
              Number(r.amount),
              r.category,
              r.description ?? null,
              r.notes ?? null,
              activeOwnerName,
            ],
          };
        });

        await turso.batch(statements);
        await fetchData();
        return { count: records.length, error: null };
      } catch (err: unknown) {
        return { count: 0, error: err as Error };
      }
    } else {
      const newItems: DailyTransaction[] = records.map((r, i) => ({
        id: `import-tx-${Date.now()}-${i}`,
        date: r.date,
        type: r.type,
        amount: Number(r.amount),
        category: r.category,
        description: r.description ?? null,
        notes: r.notes ?? null,
        created_at: new Date().toISOString(),
        created_by: activeOwnerName,
      }));
      setTransactions((prev) => [...newItems, ...prev]);
      return { count: newItems.length, error: null };
    }
  };

  // Investment CRUD
  const addInvestment = async (data: InvestmentFormData): Promise<{ error: Error | null }> => {
    const amountNum = Number(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { error: new Error('Investment amount must be a positive number') };
    }
    if (!data.date) {
      return { error: new Error('Date is required') };
    }
    if (!data.owner || !data.owner.trim()) {
      return { error: new Error('Owner is required') };
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isLive && turso) {
      try {
        await turso.execute({
          sql: `INSERT INTO investments (id, date, owner, amount, description, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            id,
            data.date,
            data.owner.trim(),
            amountNum,
            data.description ? data.description.trim() : null,
            data.notes ? data.notes.trim() : null,
            activeOwnerName,
          ],
        });

        const newInv: InvestmentRecord = {
          id,
          date: data.date,
          owner: data.owner.trim(),
          amount: amountNum,
          description: data.description ? data.description.trim() : null,
          notes: data.notes ? data.notes.trim() : null,
          created_at: new Date().toISOString(),
          created_by: activeOwnerName,
        };

        setInvestments((prev) => [newInv, ...prev]);
        return { error: null };
      } catch (err: unknown) {
        return { error: err as Error };
      }
    } else {
      const newInv: InvestmentRecord = {
        id,
        date: data.date,
        owner: data.owner.trim(),
        amount: amountNum,
        description: data.description ? data.description.trim() : null,
        notes: data.notes ? data.notes.trim() : null,
        created_at: new Date().toISOString(),
        created_by: activeOwnerName,
      };
      setInvestments((prev) => [newInv, ...prev]);
      return { error: null };
    }
  };

  const updateInvestment = async (id: string, data: InvestmentFormData): Promise<{ error: Error | null }> => {
    const amountNum = Number(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { error: new Error('Investment amount must be a positive number') };
    }

    if (isLive && turso) {
      try {
        await turso.execute({
          sql: `UPDATE investments
                SET date = ?, owner = ?, amount = ?, description = ?, notes = ?
                WHERE id = ?`,
          args: [
            data.date,
            data.owner.trim(),
            amountNum,
            data.description ? data.description.trim() : null,
            data.notes ? data.notes.trim() : null,
            id,
          ],
        });

        setInvestments((prev) =>
          prev.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  date: data.date,
                  owner: data.owner.trim(),
                  amount: amountNum,
                  description: data.description ? data.description.trim() : null,
                  notes: data.notes ? data.notes.trim() : null,
                }
              : inv
          )
        );
        return { error: null };
      } catch (err: unknown) {
        return { error: err as Error };
      }
    } else {
      setInvestments((prev) =>
        prev.map((inv) =>
          inv.id === id
            ? {
                ...inv,
                date: data.date,
                owner: data.owner.trim(),
                amount: amountNum,
                description: data.description ? data.description.trim() : null,
                notes: data.notes ? data.notes.trim() : null,
              }
            : inv
        )
      );
      return { error: null };
    }
  };

  const deleteInvestment = async (id: string): Promise<{ error: Error | null }> => {
    if (isLive && turso) {
      try {
        await turso.execute({
          sql: `DELETE FROM investments WHERE id = ?`,
          args: [id],
        });
        setInvestments((prev) => prev.filter((i) => i.id !== id));
        return { error: null };
      } catch (err: unknown) {
        return { error: err as Error };
      }
    } else {
      setInvestments((prev) => prev.filter((i) => i.id !== id));
      return { error: null };
    }
  };

  const bulkImportInvestments = async (
    records: Omit<InvestmentRecord, 'id'>[]
  ): Promise<{ count: number; error: Error | null }> => {
    if (isLive && turso) {
      try {
        const statements = records.map((r, i) => {
          const id = `import-inv-${Date.now()}-${i}`;
          return {
            sql: `INSERT INTO investments (id, date, owner, amount, description, notes, created_by)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              id,
              r.date,
              r.owner.trim(),
              Number(r.amount),
              r.description ?? null,
              r.notes ?? null,
              activeOwnerName,
            ],
          };
        });

        await turso.batch(statements);
        await fetchData();
        return { count: records.length, error: null };
      } catch (err: unknown) {
        return { count: 0, error: err as Error };
      }
    } else {
      const newItems: InvestmentRecord[] = records.map((r, i) => ({
        id: `import-inv-${Date.now()}-${i}`,
        date: r.date,
        owner: r.owner.trim(),
        amount: Number(r.amount),
        description: r.description ?? null,
        notes: r.notes ?? null,
        created_at: new Date().toISOString(),
        created_by: activeOwnerName,
      }));
      setInvestments((prev) => [...newItems, ...prev]);
      return { count: newItems.length, error: null };
    }
  };

  const clearAllLocalData = async () => {
    if (isLive && turso) {
      try {
        await turso.batch([
          'DELETE FROM daily_transactions',
          'DELETE FROM investments',
        ]);
      } catch (e) {
        console.error('Error clearing Turso tables:', e);
      }
    }
    setTransactions([]);
    setInvestments([]);
    localStorage.removeItem('leyland_local_transactions');
    localStorage.removeItem('leyland_local_investments');
  };

  const loadSampleDemoData = async () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');

    const sampleTxs: Omit<DailyTransaction, 'id'>[] = [
      {
        date: `${y}-${m}-18`,
        type: 'income',
        amount: 8500,
        category: 'Daily Collection',
        description: 'Morning & evening regular route trip',
        notes: 'Full passenger capacity on return trip',
      },
      {
        date: `${y}-${m}-18`,
        type: 'expense',
        amount: 2200,
        category: 'Fuel',
        description: 'Diesel 20 liters',
        notes: 'Filled at City Pump',
      },
      {
        date: `${y}-${m}-18`,
        type: 'expense',
        amount: 1000,
        category: 'Driver/Helper',
        description: 'Driver allowance + helper daily wage',
        notes: null,
      },
      {
        date: `${y}-${m}-19`,
        type: 'income',
        amount: 9200,
        category: 'Daily Collection',
        description: 'Daily passenger fares',
        notes: null,
      },
      {
        date: `${y}-${m}-19`,
        type: 'expense',
        amount: 2100,
        category: 'Fuel',
        description: 'Diesel refill',
        notes: null,
      },
      {
        date: `${y}-${m}-19`,
        type: 'expense',
        amount: 350,
        category: 'Toll',
        description: 'Bridge and highway toll passes',
        notes: null,
      },
      {
        date: `${y}-${m}-20`,
        type: 'income',
        amount: 8800,
        category: 'Daily Collection',
        description: 'Sunday passenger collection',
        notes: null,
      },
      {
        date: `${y}-${m}-20`,
        type: 'expense',
        amount: 2300,
        category: 'Fuel',
        description: 'Diesel refill',
        notes: null,
      },
      {
        date: `${y}-${m}-20`,
        type: 'expense',
        amount: 1200,
        category: 'Maintenance',
        description: 'Brake shoe adjustment & oil top-up',
        notes: 'Workshop inspection',
      },
    ];

    const sampleInvs: Omit<InvestmentRecord, 'id'>[] = [
      {
        date: `${y}-01-10`,
        owner: 'Brother 1',
        amount: 1200000,
        description: 'Bus body down payment & engine overhaul',
        notes: 'Bank transfer',
      },
      {
        date: `${y}-01-12`,
        owner: 'Brother 2',
        amount: 800000,
        description: 'Route permit, insurance & initial tire replacement',
        notes: 'Cash & bank deposit',
      },
    ];

    await bulkImportTransactions(sampleTxs);
    await bulkImportInvestments(sampleInvs);
  };

  return (
    <DataContext.Provider
      value={{
        transactions,
        investments,
        loading,
        error,
        filteredTransactions,
        filteredInvestments,
        summary,
        categoryBreakdown,
        monthlyFinancials,
        ownerInvestments,
        globalFilter,
        setGlobalFilter,
        setQuickFilter,
        setDateRange,
        setYearFilter,
        setMonthFilter,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        bulkImportTransactions,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        bulkImportInvestments,
        refreshData: fetchData,
        clearAllLocalData,
        loadSampleDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
