import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { DailyTransaction } from '../../types/transaction';
import { formatBDT, toBanglaDigits, formatDate } from '../../lib/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
} from 'lucide-react';

interface IncomeExpenseChartProps {
  transactions?: DailyTransaction[];
}

interface TimelinePoint {
  date: string;
  displayLabel: string;
  fullDate: string;
  income: number;
  expense: number;
  profit: number;
}

interface BarComparisonItem {
  key: string;
  name: string;
  amount: number;
  color: string;
  formattedAmount: string;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = () => {
  const { theme } = useTheme();
  const { lang, formatNumber } = useLanguage();
  const {
    globalFilter,
    filteredTransactions,
    transactions: allTransactions,
  } = useData();

  const isDark = theme === 'dark';
  const isBangla = lang === 'bn';

  // Toggle for single-day filter: Bar comparison vs 7-day trend
  const [singleDayViewMode, setSingleDayViewMode] = useState<'bar' | 'trend'>('bar');

  // Month & Day names
  const bnMonthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const bnMonthShort = [
    'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'
  ];
  const enMonthShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const bnWeekDays = ['সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি', 'রবি'];
  const enWeekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Map all transactions by date
  const dateTotalsMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    for (const tx of allTransactions) {
      if (!tx.date) continue;
      const current = map.get(tx.date) || { income: 0, expense: 0, count: 0 };
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        current.income += amt;
      } else if (tx.type === 'expense') {
        current.expense += amt;
      }
      current.count += 1;
      map.set(tx.date, current);
    }
    return map;
  }, [allTransactions]);

  // Overall totals for the active filter
  const filterTotals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') inc += amt;
      else if (tx.type === 'expense') exp += amt;
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      netProfit: inc - exp,
    };
  }, [filteredTransactions]);

  // Check filter mode
  const { quickFilter, startDate, endDate, selectedYear } = globalFilter;

  // Calculate day difference
  const daysDiff = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const isSingleDay = quickFilter === 'today' || daysDiff === 1;

  // Generate data corresponding directly to the active filter
  const { areaPoints, barItems, filterTitle, isAreaChart } = useMemo(() => {
    // -------------------------------------------------------------------------
    // 1. TODAY / SINGLE-DAY FILTER
    // -------------------------------------------------------------------------
    if (isSingleDay) {
      if (singleDayViewMode === 'trend') {
        // Show 7-day trend ending on the selected day
        const anchor = new Date(startDate || new Date().toISOString().slice(0, 10));
        const trendPoints: TimelinePoint[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(anchor);
          d.setDate(anchor.getDate() - i);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          const day = d.getDate();
          const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entry = dateTotalsMap.get(dateKey) || { income: 0, expense: 0, count: 0 };
          const mName = isBangla ? bnMonthShort[m - 1] : enMonthShort[m - 1];
          const dayFormatted = isBangla ? toBanglaDigits(String(day)) : String(day);

          trendPoints.push({
            date: dateKey,
            displayLabel: `${dayFormatted} ${mName}`,
            fullDate: formatDate(dateKey, isBangla),
            income: entry.income,
            expense: entry.expense,
            profit: entry.income - entry.expense,
          });
        }
        return {
          areaPoints: trendPoints,
          barItems: [],
          filterTitle: isBangla ? 'আজসহ গত ৭ দিনের ট্রেন্ড' : '7-Day Trend Ending Today',
          isAreaChart: true,
        };
      }

      // Bar comparison for today
      const barData: BarComparisonItem[] = [
        {
          key: 'income',
          name: isBangla ? 'কালেকশন (জমা)' : 'Collection',
          amount: filterTotals.totalIncome,
          color: '#10b981',
          formattedAmount: formatBDT(filterTotals.totalIncome, false, isBangla),
        },
        {
          key: 'expense',
          name: isBangla ? 'পরিচালন খরচ' : 'Cost',
          amount: filterTotals.totalExpense,
          color: '#ef4444',
          formattedAmount: formatBDT(filterTotals.totalExpense, false, isBangla),
        },
        {
          key: 'profit',
          name: isBangla ? 'নিট লাভ' : 'Net Profit',
          amount: Math.max(0, filterTotals.netProfit),
          color: filterTotals.netProfit >= 0 ? '#3b82f6' : '#f59e0b',
          formattedAmount: formatBDT(filterTotals.netProfit, false, isBangla),
        },
      ];

      return {
        areaPoints: [],
        barItems: barData,
        filterTitle: isBangla
          ? `আজকের হিসাব (${formatDate(startDate, isBangla)})`
          : `Today (${startDate})`,
        isAreaChart: false,
      };
    }

    // -------------------------------------------------------------------------
    // 2. THIS WEEK FILTER (Monday to Sunday: 7 Days)
    // -------------------------------------------------------------------------
    if (quickFilter === 'this-week') {
      const s = new Date(startDate);
      const weekPoints: TimelinePoint[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(s);
        d.setDate(s.getDate() + i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = dateTotalsMap.get(dateKey) || { income: 0, expense: 0, count: 0 };
        const dayName = isBangla ? bnWeekDays[i] : enWeekDays[i];
        const dayNumFormatted = isBangla ? toBanglaDigits(String(day)) : String(day);

        weekPoints.push({
          date: dateKey,
          displayLabel: `${dayName} (${dayNumFormatted})`,
          fullDate: formatDate(dateKey, isBangla),
          income: entry.income,
          expense: entry.expense,
          profit: entry.income - entry.expense,
        });
      }
      return {
        areaPoints: weekPoints,
        barItems: [],
        filterTitle: isBangla ? 'এই সপ্তাহের হিসাব (সোম ~ রবি)' : 'This Week (Mon ~ Sun)',
        isAreaChart: true,
      };
    }

    // -------------------------------------------------------------------------
    // 3. THIS MONTH FILTER (Day 1 to Last Day of Month)
    // -------------------------------------------------------------------------
    if (quickFilter === 'this-month' || (daysDiff >= 27 && daysDiff <= 31 && startDate.slice(8) === '01')) {
      const [yStr, mStr] = startDate.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
      const daysInMonth = new Date(y, m, 0).getDate();

      const monthPoints: TimelinePoint[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = dateTotalsMap.get(dateKey) || { income: 0, expense: 0, count: 0 };
        const mName = isBangla ? bnMonthShort[m - 1] : enMonthShort[m - 1];
        const dayFormatted = isBangla ? toBanglaDigits(String(day)) : String(day);

        monthPoints.push({
          date: dateKey,
          displayLabel: `${dayFormatted} ${mName}`,
          fullDate: formatDate(dateKey, isBangla),
          income: entry.income,
          expense: entry.expense,
          profit: entry.income - entry.expense,
        });
      }
      const titleMonth = isBangla ? bnMonthNames[m - 1] : enMonthShort[m - 1];
      return {
        areaPoints: monthPoints,
        barItems: [],
        filterTitle: isBangla
          ? `${titleMonth} ${formatNumber(y)} (পুরো মাসের দৈনিক গ্রাফ)`
          : `${titleMonth} ${y} (Full Month Daily Graph)`,
        isAreaChart: true,
      };
    }

    // -------------------------------------------------------------------------
    // 4. THIS YEAR FILTER (12 Months of selected year)
    // -------------------------------------------------------------------------
    if (quickFilter === 'this-year') {
      const year = selectedYear || new Date().getFullYear();
      const yearPoints: TimelinePoint[] = [];

      for (let m = 1; m <= 12; m++) {
        let mIncome = 0;
        let mExpense = 0;

        for (const [dateKey, val] of dateTotalsMap.entries()) {
          if (dateKey.startsWith(`${year}-${String(m).padStart(2, '0')}`)) {
            mIncome += val.income;
            mExpense += val.expense;
          }
        }

        const mLabel = isBangla ? bnMonthShort[m - 1] : enMonthShort[m - 1];
        const mFull = isBangla ? `${bnMonthNames[m - 1]} ${formatNumber(year)}` : `${enMonthShort[m - 1]} ${year}`;

        yearPoints.push({
          date: `${year}-${String(m).padStart(2, '0')}`,
          displayLabel: mLabel,
          fullDate: mFull,
          income: mIncome,
          expense: mExpense,
          profit: mIncome - mExpense,
        });
      }

      return {
        areaPoints: yearPoints,
        barItems: [],
        filterTitle: isBangla
          ? `${formatNumber(year)} সালের ১২ মাসের হিসাব`
          : `${year} Full Year Trend`,
        isAreaChart: true,
      };
    }

    // -------------------------------------------------------------------------
    // 5. ALL TIME FILTER (Group by month)
    // -------------------------------------------------------------------------
    if (quickFilter === 'all-time') {
      const currentYear = new Date().getFullYear();
      const yearPoints: TimelinePoint[] = [];
      for (let m = 1; m <= 12; m++) {
        let mIncome = 0;
        let mExpense = 0;

        for (const [dateKey, val] of dateTotalsMap.entries()) {
          if (dateKey.startsWith(`${currentYear}-${String(m).padStart(2, '0')}`)) {
            mIncome += val.income;
            mExpense += val.expense;
          }
        }

        const mLabel = isBangla ? bnMonthShort[m - 1] : enMonthShort[m - 1];
        const mFull = isBangla ? `${bnMonthNames[m - 1]} ${formatNumber(currentYear)}` : `${enMonthShort[m - 1]} ${currentYear}`;

        yearPoints.push({
          date: `${currentYear}-${String(m).padStart(2, '0')}`,
          displayLabel: mLabel,
          fullDate: mFull,
          income: mIncome,
          expense: mExpense,
          profit: mIncome - mExpense,
        });
      }

      return {
        areaPoints: yearPoints,
        barItems: [],
        filterTitle: isBangla ? 'সব সময়ের সামগ্রিক হিসাব' : 'All-Time Financial Overview',
        isAreaChart: true,
      };
    }

    // -------------------------------------------------------------------------
    // 6. CUSTOM DATE RANGE
    // -------------------------------------------------------------------------
    const s = new Date(startDate);
    const count = Math.min(daysDiff, 60);
    const customPoints: TimelinePoint[] = [];

    for (let i = 0; i < count; i++) {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = dateTotalsMap.get(dateKey) || { income: 0, expense: 0, count: 0 };
      const mName = isBangla ? bnMonthShort[m - 1] : enMonthShort[m - 1];
      const dayFormatted = isBangla ? toBanglaDigits(String(day)) : String(day);

      customPoints.push({
        date: dateKey,
        displayLabel: `${dayFormatted} ${mName}`,
        fullDate: formatDate(dateKey, isBangla),
        income: entry.income,
        expense: entry.expense,
        profit: entry.income - entry.expense,
      });
    }

    return {
      areaPoints: customPoints,
      barItems: [],
      filterTitle: `${formatDate(startDate, isBangla)} ~ ${formatDate(endDate, isBangla)}`,
      isAreaChart: true,
    };
  }, [
    isSingleDay,
    singleDayViewMode,
    quickFilter,
    startDate,
    endDate,
    selectedYear,
    daysDiff,
    dateTotalsMap,
    filterTotals,
    isBangla,
    formatNumber,
  ]);

  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-4">
      {/* Top Header: KPI Badges (Filtered) & Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        {/* KPI Badges corresponding directly to the active filter */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Collection Pill (Green) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isBangla ? 'কালেকশন:' : 'Collection:'}
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
              {formatBDT(filterTotals.totalIncome, false, isBangla)}
            </span>
          </div>

          {/* Cost Pill (Red) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 shadow-xs">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isBangla ? 'খরচ:' : 'Cost:'}
            </span>
            <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
              {formatBDT(filterTotals.totalExpense, false, isBangla)}
            </span>
          </div>

          {/* Net Profit Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs">
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isBangla ? 'নিট লাভ:' : 'Net:'}
            </span>
            <span
              className={`text-xs sm:text-sm font-black ${
                filterTotals.netProfit >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatBDT(filterTotals.netProfit, false, isBangla)}
            </span>
          </div>
        </div>

        {/* Single-Day view toggles if viewing Today */}
        {isSingleDay && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setSingleDayViewMode('bar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                singleDayViewMode === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isBangla ? 'আজকের গ্রাফ' : 'Today Graph'}
            </button>
            <button
              type="button"
              onClick={() => setSingleDayViewMode('trend')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                singleDayViewMode === 'trend'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isBangla ? '৭ দিনের ট্রেন্ড' : '7-Day Trend'}
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Subtitle reflecting the active filter */}
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-0.5">
        <Calendar className="w-3.5 h-3.5 text-blue-500" />
        <span>{filterTitle}</span>
      </div>

      {/* =====================================================================
          RENDER GRAPH: Area Graph (for periods) or Column Bar Graph (for Today)
         ===================================================================== */}
      {isAreaChart ? (
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={areaPoints}
              margin={{ top: 12, right: 12, left: -8, bottom: 8 }}
            >
              <defs>
                {/* 🟢 Collection Green Gradient */}
                <linearGradient id="dailyIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>

                {/* 🔴 Cost Red Gradient */}
                <linearGradient id="dailyExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

              <XAxis
                dataKey="displayLabel"
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                dy={6}
                minTickGap={16}
              />

              <YAxis
                stroke={textColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                dx={-4}
              />

              <ReferenceLine y={0} stroke={isDark ? '#64748b' : '#94a3b8'} strokeDasharray="3 3" />

              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                  fontSize: '12px',
                  padding: '10px 14px',
                }}
                formatter={(value: unknown, name: unknown) => {
                  const numVal = Number(value) || 0;
                  const isInc = name === 'income';
                  const label = isInc
                    ? (isBangla ? 'কালেকশন (জমা)' : 'Collection')
                    : (isBangla ? 'পরিচালন খরচ' : 'Cost');
                  return [formatBDT(numVal, false, isBangla), label];
                }}
                labelFormatter={(_label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullDate;
                  }
                  return '';
                }}
              />

              {/* 🟢 COLLECTION: Green Monotone Area Curve */}
              <Area
                type="monotone"
                dataKey="income"
                name="income"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#dailyIncomeGradient)"
                dot={{ r: 3.5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2.5, fill: '#fff' }}
              />

              {/* 🔴 COST: Red Monotone Area Curve */}
              <Area
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#dailyExpenseGradient)"
                dot={{ r: 3.5, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2.5, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* TODAY / SINGLE-DAY COMPARATIVE BAR GRAPH */
        <div className="space-y-4">
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barItems}
                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                barSize={56}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  fontSize={12}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  stroke={textColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '1rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                    fontSize: '12px',
                    padding: '10px 14px',
                  }}
                  formatter={(value: unknown, _name: unknown, props: { payload?: { name?: string } }) => {
                    const numVal = Number(value) || 0;
                    return [formatBDT(numVal, false, isBangla), props.payload?.name || ''];
                  }}
                />
                <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                  {barItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Today's Transactions Vouchers List */}
          {filteredTransactions.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-3">
              <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>
                  {isBangla ? 'আজকের এন্ট্রি ভাউচার' : "Today's Transaction Records"}
                </span>
                <span className="text-slate-400">
                  {formatNumber(filteredTransactions.length)} {isBangla ? 'টি' : 'records'}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto">
                {filteredTransactions.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isInc ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {tx.category}
                        </span>
                        {tx.description && (
                          <span className="text-slate-400 text-[11px] truncate max-w-[150px] sm:max-w-xs">
                            • {tx.description}
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-black ${
                          isInc
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isInc ? '+' : '-'} {formatBDT(tx.amount, false, isBangla)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
