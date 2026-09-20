import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { CategoryBreakdown } from '../../lib/calculations';
import { formatBDT } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface ExpensePieChartProps {
  breakdown: CategoryBreakdown[];
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  Fuel: '#f59e0b',
  'ডিজেল / তেল': '#f59e0b',
  'Driver/Helper': '#3b82f6',
  'ড্রাইভার ও হেল্পার': '#3b82f6',
  Maintenance: '#8b5cf6',
  'সার্ভিসিং ও ওয়াশ': '#8b5cf6',
  Repair: '#ef4444',
  'পার্টস ও মেরামত': '#ef4444',
  Toll: '#14b8a6',
  'Toll/Tax': '#14b8a6',
  'টোল ও চাঁদা': '#14b8a6',
  Food: '#10b981',
  'Food/Meals': '#10b981',
  'খোরাকি / খাবার': '#10b981',
  'খোরাকি ও খাবার': '#10b981',
  Police: '#f97316',
  'Police/Challan': '#f97316',
  'পুলিশ ও মামলা': '#f97316',
  Other: '#64748b',
  'অন্যান্য খরচ': '#64748b',
};

const PALETTE = [
  '#f59e0b', // Amber (Fuel)
  '#3b82f6', // Blue (Driver)
  '#ef4444', // Red (Repair)
  '#10b981', // Emerald (Food)
  '#8b5cf6', // Purple (Maintenance)
  '#14b8a6', // Teal (Toll)
  '#f97316', // Orange (Police)
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ breakdown }) => {
  const { lang, formatNumber } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isBangla = lang === 'bn';

  const getLocalizedName = (cat: string): string => {
    const map: Record<string, { en: string; bn: string }> = {
      Fuel: { en: 'Fuel', bn: 'ডিজেল / তেল' },
      'Driver/Helper': { en: 'Driver & Helper', bn: 'ড্রাইভার ও হেল্পার' },
      Maintenance: { en: 'Maintenance & Wash', bn: 'সার্ভিসিং ও ওয়াশ' },
      Repair: { en: 'Parts & Repair', bn: 'পার্টস ও মেরামত' },
      Toll: { en: 'Toll & Tax', bn: 'টোল ও চাঁদা' },
      'Toll/Tax': { en: 'Toll & Tax', bn: 'টোল ও চাঁদা' },
      Food: { en: 'Food Allowance', bn: 'খোরাকি / খাবার' },
      'Food/Meals': { en: 'Food Allowance', bn: 'খোরাকি / খাবার' },
      Police: { en: 'Police / Case', bn: 'পুলিশ ও মামলা' },
      'Police/Challan': { en: 'Police / Case', bn: 'পুলিশ ও মামলা' },
      Other: { en: 'Other Expense', bn: 'অন্যান্য খরচ' },
    };
    return map[cat] ? (isBangla ? map[cat].bn : map[cat].en) : cat;
  };

  const totalExpense = useMemo(() => {
    return breakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [breakdown]);

  const chartData = useMemo(() => {
    return breakdown.map((item, idx) => {
      const displayName = getLocalizedName(item.category);
      const color =
        CATEGORY_COLOR_MAP[item.category] ||
        CATEGORY_COLOR_MAP[displayName] ||
        PALETTE[idx % PALETTE.length];

      return {
        ...item,
        displayName,
        color,
      };
    });
  }, [breakdown, isBangla]);

  if (breakdown.length === 0 || totalExpense === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-xs italic">
        {isBangla ? 'কোনো খরচের রেকর্ড পাওয়া যায়নি।' : 'No expense records found for the selected filter range.'}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Donut Pie Chart Container with Centered Metric */}
      <div className="relative w-full h-56 sm:h-60 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={chartData.length > 1 ? 4 : 0}
              dataKey="amount"
              nameKey="displayName"
              stroke={isDark ? '#0f172a' : '#ffffff'}
              strokeWidth={2}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`slice-${index}`}
                  fill={entry.color}
                  className="transition-all duration-200 hover:opacity-85 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                fontSize: '12px',
                padding: '10px 14px',
              }}
              formatter={(value: unknown, _name: unknown, props: { payload?: { displayName?: string; percentage?: number } }) => {
                const num = Number(value) || 0;
                const pct = props.payload?.percentage !== undefined ? `${props.payload.percentage.toFixed(0)}%` : '';
                return [
                  `${formatBDT(num, false, isBangla)} (${formatNumber(pct)})`,
                  props.payload?.displayName || (isBangla ? 'খরচ' : 'Expense'),
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label inside Donut Hole */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isBangla ? 'মোট খরচ' : 'Total Cost'}
          </span>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
            {formatBDT(totalExpense, false, isBangla)}
          </span>
        </div>
      </div>

      {/* Category Breakdown Legend List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800/60 border-t border-slate-100 dark:border-slate-800/80 pt-2">
        {chartData.map((item) => {
          return (
            <div
              key={item.category}
              className="flex items-center justify-between pt-2 first:pt-0 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {item.displayName}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  ({formatNumber(item.count)} {isBangla ? 'টি ভাউচার' : 'items'})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                <span className="font-black text-slate-900 dark:text-slate-100">
                  {formatBDT(item.amount, false, isBangla)}
                </span>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-md min-w-[42px] text-right"
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                  }}
                >
                  {formatNumber(item.percentage.toFixed(0))}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
