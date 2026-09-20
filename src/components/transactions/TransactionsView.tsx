import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import type { DailyTransaction, TransactionFormData } from '../../types/transaction';
import { TransactionFormModal } from './TransactionFormModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { formatBDT, formatDate } from '../../lib/formatters';

export const TransactionsView: React.FC = () => {
  const {
    filteredTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useData();

  const { lang, t, formatNumber } = useLanguage();
  const isBangla = lang === 'bn';

  // Local view filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<DailyTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract unique categories
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const tx of filteredTransactions) {
      if (tx.category) cats.add(tx.category);
    }
    return Array.from(cats).sort();
  }, [filteredTransactions]);

  // Apply local search, filter, and sort
  const processedTransactions = useMemo(() => {
    return filteredTransactions
      .filter((tx) => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCat = tx.category?.toLowerCase().includes(q);
          const matchDesc = tx.description?.toLowerCase().includes(q);
          const matchNotes = tx.notes?.toLowerCase().includes(q);
          const matchAmount = String(tx.amount).includes(q);
          const matchDate = tx.date?.includes(q);
          if (!matchCat && !matchDesc && !matchNotes && !matchAmount && !matchDate) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
          return sortOrder === 'desc' ? diff : -diff;
        } else {
          const diff = Number(b.amount) - Number(a.amount);
          return sortOrder === 'desc' ? diff : -diff;
        }
      });
  }, [filteredTransactions, typeFilter, categoryFilter, searchQuery, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tx: DailyTransaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: TransactionFormData) => {
    if (editingTransaction) {
      return await updateTransaction(editingTransaction.id, formData);
    } else {
      return await addTransaction(formData);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    await deleteTransaction(deletingId);
    setIsDeleting(false);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <span>{t('navTransactions')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
              {formatNumber(processedTransactions.length)} {isBangla ? 'টি রেকর্ড' : 'records'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            HAZEE TRAVELS • Leyland 121315
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addTransaction')}</span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={isBangla ? 'খাত, নোট বা বিবরণ দিয়ে খুঁজুন...' : 'Search category, note, trip...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">ধরন:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-2 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            >
              <option value="all">{isBangla ? 'সব ধরনের হিসাব' : 'All Types'}</option>
              <option value="income">{t('income')}</option>
              <option value="expense">{t('expense')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">খাত:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-2 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            >
              <option value="all">{isBangla ? 'সব খাত' : 'All Categories'}</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">সর্ট:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as 'date' | 'amount');
                setSortOrder(so as 'asc' | 'desc');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-2 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            >
              <option value="date-desc">{isBangla ? 'তারিখ (নতুন আগে)' : 'Date (Newest first)'}</option>
              <option value="date-asc">{isBangla ? 'তারিখ (পুরাতন আগে)' : 'Date (Oldest first)'}</option>
              <option value="amount-desc">{isBangla ? 'টাকা (বেশি আগে)' : 'Amount (Highest first)'}</option>
              <option value="amount-asc">{isBangla ? 'টাকা (কম আগে)' : 'Amount (Lowest first)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Records Display */}
      {processedTransactions.length === 0 ? (
        <EmptyState
          title={isBangla ? 'কোনো হিসাব পাওয়া যায়নি' : 'No transactions found'}
          description={isBangla ? 'হাজী ট্রাভেলসের বাস পরিচালনার দৈনিক আয় ও খরচ যোগ করুন।' : 'Start logging daily income and operational expenses.'}
          icon={FileText}
          actionLabel={t('addTransaction')}
          onAction={handleOpenAdd}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">{t('date')}</th>
                    <th className="py-3 px-4">{t('category')}</th>
                    <th className="py-3 px-4">{t('description')} / {t('notes')}</th>
                    <th className="py-3 px-4 text-right">{t('amount')}</th>
                    <th className="py-3 px-4 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {processedTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatDate(tx.date, isBangla)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            <span>{tx.category}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {tx.description || tx.notes || (
                            <span className="text-slate-400 italic">—</span>
                          )}
                          {tx.description && tx.notes && (
                            <span className="block text-[11px] text-slate-400 mt-0.5 truncate">
                              {t('notes')}: {tx.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-bold text-sm ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatBDT(tx.amount, false, isBangla)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              title={t('editRecord')}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(tx.id)}
                              title={t('delete')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (optimized for bus owners on smartphones) */}
          <div className="block sm:hidden space-y-2.5">
            {processedTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center p-2 rounded-xl ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {tx.category}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {formatDate(tx.date, isBangla)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-black ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatBDT(tx.amount, false, isBangla)}
                      </div>
                    </div>
                  </div>

                  {(tx.description || tx.notes) && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                      {tx.description && <div className="font-medium">{tx.description}</div>}
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {t('notes')}: {tx.notes}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEdit(tx)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 min-h-[36px]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t('editRecord')}</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(tx.id)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors flex items-center gap-1.5 min-h-[36px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('delete')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTransaction}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title={t('confirmDeleteTitle')}
        message={t('confirmDeleteMsg')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
