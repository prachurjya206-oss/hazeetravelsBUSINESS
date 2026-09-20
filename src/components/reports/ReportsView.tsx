import React, { useState, useMemo, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  PieChart,
  FileDown,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  calculateFinancialSummary,
  calculateExpenseBreakdown,
  calculateMonthlyFinancials,
} from '../../lib/calculations';
import { formatBDT, formatDate, MONTH_NAMES, MONTH_NAMES_BN } from '../../lib/formatters';
import { MonthlyProfitChart } from '../dashboard/MonthlyProfitChart';
import { StatCard } from '../common/StatCard';

export const ReportsView: React.FC = () => {
  const { transactions, investments } = useData();
  const { lang, t, formatNumber } = useLanguage();
  const isBangla = lang === 'bn';

  // Tab: 'monthly' | 'yearly'
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');

  // Available years
  const availableYears = [2024, 2025, 2026, 2027];
  const monthNamesList = isBangla ? MONTH_NAMES_BN : MONTH_NAMES;

  // Dynamic selectors
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);

  // Pad helper
  const pad = (n: number) => String(n).padStart(2, '0');

  // Filter transactions for selected Month
  const monthlyTransactions = useMemo(() => {
    const prefix = `${selectedYear}-${pad(selectedMonth)}`;
    return transactions
      .filter((t) => t.date && t.date.startsWith(prefix))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedYear, selectedMonth]);

  // Monthly summary metrics
  const monthlySummary = useMemo(() => {
    return calculateFinancialSummary(monthlyTransactions, investments);
  }, [monthlyTransactions, investments]);

  // Monthly expense category breakdown
  const monthlyExpenseBreakdown = useMemo(() => {
    return calculateExpenseBreakdown(monthlyTransactions);
  }, [monthlyTransactions]);

  // Yearly financials
  const yearlyMonths = useMemo(() => {
    return calculateMonthlyFinancials(transactions, selectedYear);
  }, [transactions, selectedYear]);

  // Yearly summary totals
  const yearlySummary = useMemo(() => {
    const yearTxs = transactions.filter((t) => t.date && t.date.startsWith(`${selectedYear}-`));
    return calculateFinancialSummary(yearTxs, investments);
  }, [transactions, selectedYear, investments]);

  const [exporting, setExporting] = useState<'image' | 'pdf' | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  const handleSaveImage = async () => {
    if (!reportContentRef.current) return;
    setExporting('image');
    try {
      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const periodName =
        activeTab === 'monthly'
          ? `Month_${selectedMonth}_${selectedYear}`
          : `FullYear_${selectedYear}`;
      link.download = `HazeeTravels_Report_${periodName}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setExporting(null);
    }
  };

  const handleSavePdf = async () => {
    if (!reportContentRef.current) return;
    setExporting('pdf');
    try {
      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const periodName =
        activeTab === 'monthly'
          ? `Month_${selectedMonth}_${selectedYear}`
          : `FullYear_${selectedYear}`;
      pdf.save(`HazeeTravels_Report_${periodName}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header with Save Options and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-none print:shadow-none">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {t('reports')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            HAZEE TRAVELS • Leyland 121315 {isBangla ? 'মাসিক ও বার্ষিক আর্থিক হিসাব বিবরণী' : 'financial performance audit'}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden flex-wrap">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t('monthlyView')}
            </button>
            <button
              onClick={() => setActiveTab('yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t('yearlyView')}
            </button>
          </div>

          {/* Save as Picture (PNG) */}
          <button
            onClick={handleSaveImage}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs min-h-[36px] disabled:opacity-50"
            title="Download report as PNG Image"
          >
            {exporting === 'image' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {exporting === 'image' ? t('exporting') : t('savePicture')}
            </span>
          </button>

          {/* Save as PDF */}
          <button
            onClick={handleSavePdf}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs min-h-[36px] disabled:opacity-50"
            title="Download report as PDF Document"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-white" />
            )}
            <span>
              {exporting === 'pdf' ? t('exporting') : t('savePdf')}
            </span>
          </button>
        </div>
      </div>

      {/* Printable / Downloadable Content Container */}
      <div ref={reportContentRef} className="space-y-6 bg-slate-50/50 dark:bg-slate-900/30 p-2 sm:p-4 rounded-2xl">
        {/* Official Hazee Travels Company Report Banner */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Hazee Travels Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  HAZEE TRAVELS
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Leyland 121315
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {activeTab === 'monthly'
                  ? (isBangla ? `${monthNamesList[selectedMonth - 1]} ${formatNumber(selectedYear)} - মাসিক হিসাব বিবরণী` : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} - Monthly Audit Report`)
                  : (isBangla ? `${formatNumber(selectedYear)} সাল - বার্ষিক হিসাব বিবরণী` : `${selectedYear} - Annual Financial Statement`)}
              </h2>
            </div>
          </div>
          <div className="text-left sm:text-right text-[11px] text-slate-400 font-medium">
            <span>{isBangla ? 'রিপোর্ট তৈরির তারিখ:' : 'Generated:'} {formatDate(new Date().toISOString().slice(0, 10), isBangla)}</span>
          </div>
        </div>

      {/* =========================================================================
          MONTHLY REPORT VIEW
         ========================================================================= */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Dynamic Selector Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('year')}:
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {formatNumber(yr)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('month')}:
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
                >
                  {monthNamesList.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {isBangla ? 'নির্বাচিত রিপোর্ট:' : 'Viewing Report for:'}{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {monthNamesList[selectedMonth - 1]} {formatNumber(selectedYear)}
              </strong>
            </div>
          </div>

          {/* Monthly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('totalIncome')}
              value={formatBDT(monthlySummary.totalIncome, false, isBangla)}
              subtitle={`${isBangla ? 'দৈনিক গড়' : 'Average'} ${formatBDT(monthlySummary.avgDailyIncome, false, isBangla)} / ${isBangla ? 'দিন' : 'day'}`}
              icon={TrendingUp}
              variant="emerald"
            />
            <StatCard
              title={t('totalExpenses')}
              value={formatBDT(monthlySummary.totalExpense, false, isBangla)}
              subtitle={`${isBangla ? 'দৈনিক গড়' : 'Average'} ${formatBDT(monthlySummary.avgDailyExpense, false, isBangla)} / ${isBangla ? 'দিন' : 'day'}`}
              icon={TrendingDown}
              variant="rose"
            />
            <StatCard
              title={t('netProfit')}
              value={formatBDT(monthlySummary.netProfit, false, isBangla)}
              subtitle={`${isBangla ? 'লাভের হার:' : 'Margin:'} ${formatNumber(monthlySummary.profitMargin.toFixed(1))}%`}
              icon={DollarSign}
              variant={monthlySummary.netProfit >= 0 ? 'emerald' : 'rose'}
              badge={monthlySummary.netProfit >= 0 ? t('profitable') : t('deficit')}
              badgeType={monthlySummary.netProfit >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              title={t('operatingDays')}
              value={`${formatNumber(monthlySummary.operatingDays)} ${isBangla ? 'দিন' : 'Days'}`}
              subtitle={`${isBangla ? 'এই মাসে মোট' : 'Out of'} ${formatNumber(new Date(selectedYear, selectedMonth, 0).getDate())} ${isBangla ? 'দিনের মধ্যে' : 'days in month'}`}
              icon={Clock}
              variant="indigo"
            />
          </div>

          {/* Expense Category Breakdown & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>{t('chartExpenseBreakdown')}</span>
              </h3>

              {monthlyExpenseBreakdown.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-6 text-center">
                  {isBangla
                    ? `${monthNamesList[selectedMonth - 1]} ${formatNumber(selectedYear)}-এ কোনো খরচের হিসাব নেই।`
                    : `No expense records logged in ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`}
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyExpenseBreakdown.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {formatBDT(cat.amount, false, isBangla)}
                          </span>
                          <span className="text-slate-400 w-9 text-right font-medium">
                            {formatNumber(cat.percentage.toFixed(0))}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="bg-slate-900 dark:bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Transactions Table for the Selected Month */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isBangla ? 'দৈনিক লেনদেন বিবরণী' : 'Daily Transactions'} ({monthNamesList[selectedMonth - 1]} {formatNumber(selectedYear)})
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatNumber(monthlyTransactions.length)} {isBangla ? 'টি হিসাব রেকর্ড করা আছে' : 'records logged'}
                  </p>
                </div>
              </div>

              {monthlyTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {isBangla
                    ? `${monthNamesList[selectedMonth - 1]} ${formatNumber(selectedYear)}-এ কোনো লেনদেন রেকর্ড করা হয়নি।`
                    : `No transactions recorded for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`}
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">{t('date')}</th>
                        <th className="py-2.5 px-3">{isBangla ? 'ধরন' : 'Type'}</th>
                        <th className="py-2.5 px-3">{t('category')}</th>
                        <th className="py-2.5 px-3">{t('description')}</th>
                        <th className="py-2.5 px-3 text-right">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {monthlyTransactions.map((tx) => {
                        const isIncome = tx.type === 'income';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {formatDate(tx.date, isBangla)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isIncome
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                {isIncome ? '+' : '-'} {isIncome ? (isBangla ? 'আয়' : 'Income') : (isBangla ? 'খরচ' : 'Expense')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {tx.category}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                              {tx.description || <span className="italic">—</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                              <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                                {isIncome ? '+' : '-'} {formatBDT(tx.amount, false, isBangla)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          YEARLY REPORT VIEW
         ========================================================================= */}
      {activeTab === 'yearly' && (
        <div className="space-y-6">
          {/* Dynamic Year Selector */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('year')}:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[40px]"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {formatNumber(yr)}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {isBangla ? 'বার্ষিক বিবরণী:' : 'Annual Audit for:'}{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{formatNumber(selectedYear)}</strong>
            </div>
          </div>

          {/* Yearly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={isBangla ? 'মোট বার্ষিক আয়' : 'Total Annual Income'}
              value={formatBDT(yearlySummary.totalIncome, false, isBangla)}
              subtitle={`${isBangla ? 'মোট সক্রিয় দিন:' : 'Over'} ${formatNumber(yearlySummary.operatingDays)} ${isBangla ? 'দিন' : 'operating days'}`}
              icon={TrendingUp}
              variant="emerald"
            />
            <StatCard
              title={isBangla ? 'মোট বার্ষিক খরচ' : 'Total Annual Expenses'}
              value={formatBDT(yearlySummary.totalExpense, false, isBangla)}
              subtitle={isBangla ? 'ডিজেল, মজুরি, টোল ও পার্টস' : 'Fuel, wages, toll & maintenance'}
              icon={TrendingDown}
              variant="rose"
            />
            <StatCard
              title={isBangla ? 'মোট বার্ষিক নিট লাভ' : 'Total Annual Net Profit'}
              value={formatBDT(yearlySummary.netProfit, false, isBangla)}
              subtitle={`${isBangla ? 'বার্ষিক মার্জিন:' : 'Annual Margin:'} ${formatNumber(yearlySummary.profitMargin.toFixed(1))}%`}
              icon={DollarSign}
              variant={yearlySummary.netProfit >= 0 ? 'emerald' : 'rose'}
              badge={yearlySummary.netProfit >= 0 ? t('profitable') : t('deficit')}
              badgeType={yearlySummary.netProfit >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              title={t('operatingDays')}
              value={`${formatNumber(yearlySummary.operatingDays)} ${isBangla ? 'দিন' : 'Days'}`}
              subtitle={`${isBangla ? 'মোট বাস চলার দিন' : 'Active bus run days in'} ${formatNumber(selectedYear)}`}
              icon={Clock}
              variant="indigo"
            />
          </div>

          {/* Yearly Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('chartMonthlyProfit')} ({formatNumber(selectedYear)})
            </h3>
            <MonthlyProfitChart data={yearlyMonths} year={selectedYear} />
          </div>

          {/* 12-Month Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('monthByMonth')} ({formatNumber(selectedYear)})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">{t('month')}</th>
                    <th className="py-3 px-4 text-center">{t('operatingDays')}</th>
                    <th className="py-3 px-4 text-right">{t('totalIncome')}</th>
                    <th className="py-3 px-4 text-right">{t('totalExpenses')}</th>
                    <th className="py-3 px-4 text-right">{t('netProfit')}</th>
                    <th className="py-3 px-4 text-right">{isBangla ? 'মার্জিন' : 'Margin'} %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {yearlyMonths.map((m) => {
                    const isProfit = m.profit >= 0;
                    return (
                      <tr
                        key={m.monthIndex}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {monthNamesList[m.monthIndex]}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                          {m.operatingDays > 0 ? `${formatNumber(m.operatingDays)} ${isBangla ? 'দিন' : 'days'}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatBDT(m.income, false, isBangla)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatBDT(m.expense, false, isBangla)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            isProfit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatBDT(m.profit, false, isBangla)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-500">
                          {m.income > 0 ? `${formatNumber(m.margin.toFixed(1))}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-850 font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
                  <tr>
                    <td className="py-3 px-4">{isBangla ? 'পুরো বছরের মোট' : 'Full Year Total'}</td>
                    <td className="py-3 px-4 text-center">{formatNumber(yearlySummary.operatingDays)} {isBangla ? 'দিন' : 'days'}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      {formatBDT(yearlySummary.totalIncome, false, isBangla)}
                    </td>
                    <td className="py-3 px-4 text-right">{formatBDT(yearlySummary.totalExpense, false, isBangla)}</td>
                    <td
                      className={`py-3 px-4 text-right ${
                        yearlySummary.netProfit >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatBDT(yearlySummary.netProfit, false, isBangla)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(yearlySummary.profitMargin.toFixed(1))}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
