import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Plus,
  Circle,
  Languages,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { isDatabaseConnected } from '../../lib/turso';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onOpenAddTransaction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onOpenAddTransaction,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { activeOwnerName, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const isLive = isDatabaseConnected();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile menu button and brand logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 lg:hidden">
            <img
              src="/logo.png"
              alt="Hazee Travels"
              className="h-8 w-auto object-contain"
            />
            <div className="hidden xs:block">
              <span className="font-black text-xs tracking-tight text-slate-900 dark:text-slate-100 block">
                HAZEE TRAVELS
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Leyland 121315
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons, language toggle, status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Turso Database Connection status badge (desktop) */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            <Circle className={`w-2 h-2 fill-current ${isLive ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span>{isLive ? t('tursoConnected') : t('localStorageMode')}</span>
          </div>

          {/* Quick Add Record Button (Desktop) */}
          <button
            onClick={onOpenAddTransaction}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addRecord')}</span>
          </button>

          {/* Language Switcher Button (BN / EN) */}
          <button
            onClick={toggleLang}
            title="Switch Language (বাংলা / English)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Active Owner Profile & Logout */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 py-1 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                {activeOwnerName.slice(0, 1)}
              </span>
              <span className="hidden sm:inline">{activeOwnerName}</span>
            </div>

            <button
              onClick={logout}
              title={t('signOut')}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
