import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Landmark,
  BarChart3,
} from 'lucide-react';
import type { NavTab } from './Sidebar';
import { useLanguage } from '../../context/LanguageContext';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddTransaction: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const { t } = useLanguage();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
            currentTab === 'dashboard'
              ? 'text-blue-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-tight">{t('navDashboard')}</span>
        </button>

        {/* Daily Records */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
            currentTab === 'transactions'
              ? 'text-blue-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-tight">{t('navTransactions')}</span>
        </button>

        {/* Center Quick Add Button (Elevated Action) */}
        <div className="relative -top-3">
          <button
            onClick={onOpenAddTransaction}
            title={t('addRecord')}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-slate-50 dark:border-slate-950"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Investments */}
        <button
          onClick={() => onSelectTab('investments')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
            currentTab === 'investments'
              ? 'text-blue-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-tight">{t('navInvestments')}</span>
        </button>

        {/* Reports */}
        <button
          onClick={() => onSelectTab('reports')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
            currentTab === 'reports'
              ? 'text-blue-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-tight">{t('navReports')}</span>
        </button>
      </div>
    </div>
  );
};
