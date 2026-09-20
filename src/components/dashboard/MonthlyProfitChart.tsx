import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { MonthlyFinancial } from '../../lib/calculations';
import { formatBDT } from '../../lib/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface MonthlyProfitChartProps {
  data: MonthlyFinancial[];
  year: number;
}

export const MonthlyProfitChart: React.FC<MonthlyProfitChartProps> = ({ data, year }) => {
  const { theme } = useTheme();
  const { lang, formatNumber } = useLanguage();
  const isDark = theme === 'dark';
  const isBangla = lang === 'bn';

  const hasData = data.some((m) => m.income > 0 || m.expense > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-xs italic">
        {isBangla ? `${formatNumber(year)} সালের কোনো মাসিক হিসাব পাওয়া যায়নি।` : `No monthly financial records found for ${year}.`}
      </div>
    );
  }

  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: -8, bottom: 8 }}
        >
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

          <XAxis
            dataKey="monthName"
            stroke={textColor}
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
            dy={6}
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
            formatter={(value: unknown) => {
              const num = Number(value) || 0;
              return [formatBDT(num, false, isBangla), isBangla ? 'মাসিক নিট লাভ' : 'Monthly Net Profit'];
            }}
            labelFormatter={(label) => `${label} ${formatNumber(year)}`}
          />

          <Area
            type="monotone"
            dataKey="profit"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#profitGradient)"
            dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
