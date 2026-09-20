import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Landmark,
  ShieldCheck,
  Edit2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import type { InvestmentRecord, InvestmentFormData } from '../../types/investment';
import { InvestmentFormModal } from './InvestmentFormModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { formatBDT, formatDate, MONTH_NAMES, MONTH_NAMES_BN } from '../../lib/formatters';

export const InvestmentsView: React.FC = () => {
  const {
    investments,
    ownerInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    bulkImportInvestments,
  } = useData();

  const { lang, t, formatNumber } = useLanguage();
  const isBangla = lang === 'bn';

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [importNotice, setImportNotice] = useState<string | null>(null);

  const allOwners = useMemo(() => {
    const set = new Set<string>(['Walid', 'Radwan']);
    investments.forEach((inv) => {
      if (inv.owner) set.add(inv.owner);
    });
    return Array.from(set);
  }, [investments]);

  const availableYears = [2024, 2025, 2026, 2027];
  const monthNamesList = isBangla ? MONTH_NAMES_BN : MONTH_NAMES;

  // Filtered investments
  const processedInvestments = useMemo(() => {
    return investments.filter((inv) => {
      if (ownerFilter !== 'all' && inv.owner !== ownerFilter) return false;

      if (yearFilter !== 'all') {
        const invYear = Number(inv.date?.split('-')[0]);
        if (invYear !== yearFilter) return false;
      }

      if (monthFilter !== 'all') {
        const invMonth = Number(inv.date?.split('-')[1]);
        if (invMonth !== monthFilter) return false;
      }

      if (startDate && inv.date < startDate) return false;
      if (endDate && inv.date > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOwner = inv.owner?.toLowerCase().includes(q);
        const matchDesc = inv.description?.toLowerCase().includes(q);
        const matchNotes = inv.notes?.toLowerCase().includes(q);
        const matchAmount = String(inv.amount).includes(q);
        if (!matchOwner && !matchDesc && !matchNotes && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [investments, ownerFilter, yearFilter, monthFilter, startDate, endDate, searchQuery]);

  const grandTotalInvestment = useMemo(() => {
    return investments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [investments]);

  const handleOpenAdd = () => {
    setEditingInvestment(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (inv: InvestmentRecord) => {
    setEditingInvestment(inv);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: InvestmentFormData) => {
    if (editingInvestment) {
      return await updateInvestment(editingInvestment.id, formData);
    } else {
      return await addInvestment(formData);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    await deleteInvestment(deletingId);
    setIsDeleting(false);
    setDeletingId(null);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setImportNotice('CSV file is empty or missing headers.');
          return;
        }

        const newRecords: Omit<InvestmentRecord, 'id'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
          if (cols.length >= 3) {
            const date = cols[0];
            const owner = cols[1];
            const amount = parseFloat(cols[2]);
            const description = cols[3] || '';
            const notes = cols[4] || '';

            if (date && owner && !isNaN(amount) && amount > 0) {
              newRecords.push({
                date,
                owner,
                amount,
                description,
                notes,
              });
            }
          }
        }

        if (newRecords.length === 0) {
          setImportNotice('No valid investment records could be parsed.');
          return;
        }

        const res = await bulkImportInvestments(newRecords);
        if (res.error) {
          setImportNotice(`Import error: ${res.error.message}`);
        } else {
          setImportNotice(`Successfully imported ${res.count} records to Turso!`);
          setTimeout(() => setImportNotice(null), 5000);
        }
      } catch (err) {
        setImportNotice(`CSV parse error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <span>{t('capitalInvestments')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
              {t('capitalEquity')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            HAZEE TRAVELS • {isBangla ? 'ওয়ালিদ ও রেদোয়ান' : 'Walid & Radwan'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors border border-slate-200 dark:border-slate-700 min-h-[40px]">
            <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>CSV {isBangla ? 'আমদানি' : 'Import'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('recordInvestment')}</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 text-xs rounded-xl border border-blue-200 dark:border-blue-900 flex items-center justify-between">
          <span>{importNotice}</span>
          <button
            onClick={() => setImportNotice(null)}
            className="font-bold underline text-blue-900 dark:text-blue-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Accounting Notice */}
      <div className="p-3.5 bg-slate-100/70 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-slate-200">
            {isBangla ? 'মূলধন ও লাভের পৃথকীকরণ নীতি:' : 'Accounting Separation Rule:'}
          </span>{' '}
          {t('isolatedCapitalNotice')}
        </div>
      </div>

      {/* Owner Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isBangla ? 'মোট ব্যবসায়িক মূলধন' : 'Total Business Capital'}
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {formatBDT(grandTotalInvestment, false, isBangla)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {formatNumber(investments.length)} {isBangla ? 'টি কিস্তিতে বিনিয়োগ' : 'total contributions'}
          </div>
        </div>

        {ownerInvestments.length > 0 ? (
          ownerInvestments.map((item) => (
            <div
              key={item.owner}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                  {item.owner === 'Radwan' && isBangla ? 'রেদোয়ান' : item.owner === 'Walid' && isBangla ? 'ওয়ালিদ' : item.owner}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
                  {formatNumber(item.percentage.toFixed(1))}% {isBangla ? 'শেয়ার' : 'Share'}
                </span>
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                {formatBDT(item.totalAmount, false, isBangla)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {formatNumber(item.count)} {isBangla ? 'টি বিনিয়োগ রেকর্ড' : 'records logged'}
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
            {isBangla ? 'এখনো কোনো বিনিয়োগ রেকর্ড জমা দেওয়া হয়নি।' : 'No owner investments recorded yet.'}
          </div>
        )}
      </div>

      {/* Equity Share Progress Bar */}
      {grandTotalInvestment > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-slate-700 dark:text-slate-300">
              {t('partnershipEquity')}
            </span>
            <span className="text-slate-400">১০০% মূলধনীকরণ</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {ownerInvestments.map((item, idx) => {
              const bgColors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
              const color = bgColors[idx % bgColors.length];
              return (
                <div
                  key={item.owner}
                  title={`${item.owner}: ${item.percentage.toFixed(1)}%`}
                  style={{ width: `${item.percentage}%` }}
                  className={`${color} h-full transition-all duration-300`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
            {ownerInvestments.map((item, idx) => {
              const textColors = ['text-blue-600 dark:text-blue-400', 'text-emerald-600 dark:text-emerald-400', 'text-amber-600 dark:text-amber-400', 'text-purple-600 dark:text-purple-400'];
              const dotColors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
              return (
                <div key={item.owner} className="flex items-center gap-1.5 font-bold">
                  <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.owner === 'Radwan' && isBangla ? 'রেদোয়ান' : item.owner === 'Walid' && isBangla ? 'ওয়ালিদ' : item.owner}:
                  </span>
                  <span className={textColors[idx % textColors.length]}>
                    {formatNumber(item.percentage.toFixed(1))}% ({formatBDT(item.totalAmount, false, isBangla)})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={isBangla ? 'বিবরণ বা নোট খুঁজুন...' : 'Search description, notes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium shrink-0">মালিক:</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2 py-2 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            >
              <option value="all">{isBangla ? 'সব মালিক' : 'All Owners'}</option>
              {allOwners.map((o) => (
                <option key={o} value={o}>
                  {o === 'Radwan' && isBangla ? 'রেদোয়ান' : o === 'Walid' && isBangla ? 'ওয়ালিদ' : o}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium shrink-0">{t('year')}:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2 py-2 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            >
              <option value="all">{isBangla ? 'সব বছর' : 'All Years'}</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {formatNumber(yr)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium shrink-0">{t('month')}:</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2 py-2 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            >
              <option value="all">{isBangla ? 'সব মাস' : 'All Months'}</option>
              {monthNamesList.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setOwnerFilter('all');
              setYearFilter('all');
              setMonthFilter('all');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
          >
            {t('resetFilter')}
          </button>
        </div>
      </div>

      {/* Investment Records Display */}
      {processedInvestments.length === 0 ? (
        <EmptyState
          title={isBangla ? 'কোনো বিনিয়োগ রেকর্ড পাওয়া যায়নি' : 'No investment records found'}
          description={isBangla ? 'ওয়ালিদ বা রেদোয়ানের বাস কেনা বা সম্প্রসারণের মূলধন বিনিয়োগ যোগ করুন।' : 'Record capital injections by Walid and Radwan.'}
          icon={Landmark}
          actionLabel={t('recordInvestment')}
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
                    <th className="py-3 px-4">{t('investingOwner')}</th>
                    <th className="py-3 px-4">{t('investmentPurpose')}</th>
                    <th className="py-3 px-4">{t('notes')}</th>
                    <th className="py-3 px-4 text-right">{t('amount')}</th>
                    <th className="py-3 px-4 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {processedInvestments.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatDate(inv.date, isBangla)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {inv.owner}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {inv.description || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {inv.notes || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                          {formatBDT(inv.amount, false, isBangla)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            title={t('editRecord')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(inv.id)}
                            title={t('delete')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-2.5">
            {processedInvestments.map((inv) => (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {inv.owner}
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-1">
                      {formatDate(inv.date, isBangla)}
                    </span>
                  </div>
                  <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {formatBDT(inv.amount, false, isBangla)}
                  </div>
                </div>

                {(inv.description || inv.notes) && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                    {inv.description && <div className="font-medium">{inv.description}</div>}
                    {inv.notes && <div className="text-[11px] text-slate-400 mt-0.5">{t('notes')}: {inv.notes}</div>}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(inv)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 min-h-[36px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t('editRecord')}</span>
                  </button>
                  <button
                    onClick={() => setDeletingId(inv.id)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors flex items-center gap-1.5 min-h-[36px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('delete')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      <InvestmentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingInvestment(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingInvestment}
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
