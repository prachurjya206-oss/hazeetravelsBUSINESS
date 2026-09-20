import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  Plus,
  ArrowRight,
  Bus,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatCard } from '../common/StatCard';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { MonthlyProfitChart } from './MonthlyProfitChart';
import { ExpensePieChart } from './ExpensePieChart';
import { formatBDT, formatDate } from '../../lib/formatters';

interface DashboardViewProps {
  onNavigate: (tab: 'dashboard' | 'transactions' | 'investments' | 'reports' | 'settings') => void;
  onOpenAddTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddTransaction,
}) => {
  const {
    summary,
    filteredTransactions,
    monthlyFinancials,
    categoryBreakdown,
    globalFilter,
  } = useData();

  const { lang, t, formatNumber } = useLanguage();
  const isBangla = lang === 'bn';

  const recentTransactions = filteredTransactions.slice(0, 5);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Banner / Overview with Hazee Travels Logo */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-1.5 shadow-md flex items-center justify-center shrink-0 border border-slate-200">
            <img
              src="/logo.png"
              alt="Hazee Travels Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                HAZEE TRAVELS
              </span>
              <span className="text-xs text-slate-400">
                Leyland 121315
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              {t('appName')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenAddTransaction}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addRecord')}</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <span>{t('navReports')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Income */}
        <StatCard
          title={t('totalIncome')}
          value={formatBDT(summary.totalIncome, false, isBangla)}
          subtitle={
            summary.operatingDays > 0
              ? `${t('avgDailyIncome')}: ${formatBDT(summary.avgDailyIncome, false, isBangla)}`
              : t('commercialBus')
          }
          icon={TrendingUp}
          variant="emerald"
          badge={`${formatNumber(summary.operatingDays)} ${t('activeDays')}`}
          badgeType="success"
          onClick={() => onNavigate('transactions')}
        />

        {/* Total Expenses */}
        <StatCard
          title={t('totalExpenses')}
          value={formatBDT(summary.totalExpense, false, isBangla)}
          subtitle={
            summary.operatingDays > 0
              ? `${t('avgDailyExpense')}: ${formatBDT(summary.avgDailyExpense, false, isBangla)}`
              : t('commercialBus')
          }
          icon={TrendingDown}
          variant="rose"
          onClick={() => onNavigate('transactions')}
        />

        {/* Net Profit */}
        <StatCard
          title={t('netProfit')}
          value={formatBDT(summary.netProfit, false, isBangla)}
          subtitle={
            summary.totalIncome > 0
              ? `Margin: ${formatNumber(summary.profitMargin.toFixed(1))}%`
              : ''
          }
          icon={DollarSign}
          variant={summary.netProfit >= 0 ? 'emerald' : 'rose'}
          badge={summary.netProfit >= 0 ? t('profitable') : t('deficit')}
          badgeType={summary.netProfit >= 0 ? 'success' : 'danger'}
          onClick={() => onNavigate('reports')}
        />

        {/* Total Investment (Isolated Capital) */}
        <StatCard
          title={t('totalInvestment')}
          value={formatBDT(summary.totalInvestment, false, isBangla)}
          subtitle={t('isolatedCapitalNotice')}
          icon={Landmark}
          variant="indigo"
          badge={t('capitalEquity')}
          badgeType="info"
          onClick={() => onNavigate('investments')}
        />
      </div>

      {/* Chart Section 1: Income vs Expenses Over Time */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-600" />
              <span>{t('chartIncomeVsExpense')}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {globalFilter.quickFilter === 'today'
                ? (isBangla ? `আজকের হিসাব: ${formatDate(globalFilter.startDate, isBangla)}` : `Today: ${globalFilter.startDate}`)
                : globalFilter.quickFilter === 'this-week'
                ? (isBangla ? `চলতি সপ্তাহ: ${formatDate(globalFilter.startDate, isBangla)} ~ ${formatDate(globalFilter.endDate, isBangla)}` : `This Week: ${globalFilter.startDate} ~ ${globalFilter.endDate}`)
                : globalFilter.quickFilter === 'this-month'
                ? (isBangla ? `চলতি মাস (${formatDate(globalFilter.startDate, isBangla)} ~ ${formatDate(globalFilter.endDate, isBangla)})` : `This Month (${globalFilter.startDate} ~ ${globalFilter.endDate})`)
                : globalFilter.quickFilter === 'this-year'
                ? (isBangla ? `${formatNumber(globalFilter.selectedYear)} সালের হিসাব` : `Year ${globalFilter.selectedYear}`)
                : globalFilter.quickFilter === 'all-time'
                ? (isBangla ? 'সব সময়ের মোট হিসাব' : 'All-Time Records')
                : `${formatDate(globalFilter.startDate, isBangla)} ~ ${formatDate(globalFilter.endDate, isBangla)}`}
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {t('appName')}
          </span>
        </div>

        <IncomeExpenseChart transactions={filteredTransactions} />
      </div>

      {/* Chart Section 2: Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Monthly Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{t('chartMonthlyProfit')} ({formatNumber(globalFilter.selectedYear)})</span>
              </h2>
            </div>
          </div>
          <div className="flex-1">
            <MonthlyProfitChart
              data={monthlyFinancials}
              year={globalFilter.selectedYear}
            />
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>{t('chartExpenseBreakdown')}</span>
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {t('totalExpenses')}: {formatBDT(summary.totalExpense, false, isBangla)}
            </span>
          </div>
          <div className="flex-1">
            <ExpensePieChart breakdown={categoryBreakdown} />
          </div>
        </div>
      </div>

      {/* Recent Activity Table Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t('recentTransactions')}
            </h2>
            <p className="text-xs text-slate-400">
              {formatNumber(recentTransactions.length)} {t('viewAll')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-blue-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {isBangla ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions found for the selected filter range.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {tx.category}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDate(tx.date, isBangla)}{' '}
                        {tx.description && `• ${tx.description}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs sm:text-sm font-bold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatBDT(tx.amount, false, isBangla)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
