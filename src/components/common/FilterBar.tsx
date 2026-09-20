import React, { useState } from 'react';
import { Calendar, ChevronDown, Filter, RotateCcw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import type { QuickFilterType } from '../../types/filter';
import { MONTH_NAMES, MONTH_NAMES_BN } from '../../lib/formatters';

export const FilterBar: React.FC = () => {
  const {
    globalFilter,
    setQuickFilter,
    setDateRange,
    setYearFilter,
    setMonthFilter,
  } = useData();

  const { lang, t, formatNumber } = useLanguage();
  const isBangla = lang === 'bn';

  const [showCustomRange, setShowCustomRange] = useState(globalFilter.quickFilter === 'custom');

  const availableYears = [2024, 2025, 2026, 2027];

  const quickFilterOptions: { label: string; value: QuickFilterType }[] = [
    { label: t('today'), value: 'today' },
    { label: t('thisWeek'), value: 'this-week' },
    { label: t('thisMonth'), value: 'this-month' },
    { label: t('thisYear'), value: 'this-year' },
    { label: t('allTime'), value: 'all-time' },
  ];

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(e.target.value, globalFilter.endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(globalFilter.startDate, e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearFilter(Number(e.target.value));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthFilter(Number(e.target.value));
  };

  const monthNamesList = isBangla ? MONTH_NAMES_BN : MONTH_NAMES;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm mb-5 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('filter')}:</span>
          </div>

          {quickFilterOptions.map((opt) => {
            const isActive = globalFilter.quickFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setQuickFilter(opt.value);
                  setShowCustomRange(false);
                }}
                className={`px-3 py-2 sm:py-1.5 text-xs font-bold rounded-xl shrink-0 transition-all duration-150 min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowCustomRange(!showCustomRange)}
            className={`px-3 py-2 sm:py-1.5 text-xs font-bold rounded-xl shrink-0 flex items-center gap-1 transition-all duration-150 min-h-[38px] sm:min-h-0 ${
              globalFilter.quickFilter === 'custom' || showCustomRange
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('custom')}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-150 ${
                showCustomRange ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Year & Month Dropdowns */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">{t('year')}:</span>
            <select
              value={globalFilter.selectedYear}
              onChange={handleYearChange}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-2 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[38px]"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {formatNumber(yr)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">{t('month')}:</span>
            <select
              value={globalFilter.selectedMonth}
              onChange={handleMonthChange}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-2 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[38px]"
            >
              {monthNamesList.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setQuickFilter('this-month')}
            title={t('resetFilter')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Custom Date Range Picker */}
      {showCustomRange && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('fromDate')}:
            </label>
            <input
              type="date"
              value={globalFilter.startDate}
              onChange={handleStartDateChange}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('toDate')}:
            </label>
            <input
              type="date"
              value={globalFilter.endDate}
              onChange={handleEndDateChange}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <span className="text-xs text-slate-400 italic">
            {globalFilter.startDate} ~ {globalFilter.endDate}
          </span>
        </div>
      )}
    </div>
  );
};
