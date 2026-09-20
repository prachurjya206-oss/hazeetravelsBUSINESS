import React, { useState } from 'react';
import {
  Settings,
  Database,
  Users,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Bus,
  Copy,
  Check,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { isDatabaseConnected } from '../../lib/turso';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    transactions,
    investments,
    clearAllLocalData,
    loadSampleDemoData,
    bulkImportTransactions,
  } = useData();

  const { activeOwnerName, setActiveOwnerName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, t, formatNumber } = useLanguage();
  const isBangla = lang === 'bn';

  const [copiedSql, setCopiedSql] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [txImportNotice, setTxImportNotice] = useState<string | null>(null);

  const isLive = isDatabaseConnected();

  // Export transactions to CSV
  const handleExportTransactions = () => {
    if (transactions.length === 0) {
      alert(isBangla ? 'রপ্তানি করার মতো কোনো লেনদেন নেই।' : 'No transactions to export.');
      return;
    }

    const headers = ['id', 'date', 'type', 'amount', 'category', 'description', 'notes', 'created_at'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.type,
      t.amount,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.created_at || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hazeebus_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export investments to CSV
  const handleExportInvestments = () => {
    if (investments.length === 0) {
      alert(isBangla ? 'রপ্তানি করার মতো কোনো বিনিয়োগ নেই।' : 'No investments to export.');
      return;
    }

    const headers = ['id', 'date', 'owner', 'amount', 'description', 'notes', 'created_at'];
    const rows = investments.map((i) => [
      i.id,
      i.date,
      `"${(i.owner || '').replace(/"/g, '""')}"`,
      i.amount,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
      i.created_at || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hazeebus_investments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Transaction CSV Import
  const handleTransactionCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setTxImportNotice('CSV file is empty or missing headers.');
          return;
        }

        const toAdd: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
          if (cols.length >= 4) {
            const date = cols[0];
            const type = cols[1].toLowerCase() === 'income' ? 'income' : 'expense';
            const amount = parseFloat(cols[2]);
            const category = cols[3];
            const description = cols[4] || '';
            const notes = cols[5] || '';

            if (date && !isNaN(amount) && amount > 0 && category) {
              toAdd.push({
                date,
                type,
                amount,
                category,
                description,
                notes,
              });
            }
          }
        }

        if (toAdd.length === 0) {
          setTxImportNotice(isBangla ? 'সিএসভিতে কোনো বৈধ লেনদেনের রেকর্ড মেলেনি।' : 'No valid transaction rows found in CSV.');
          return;
        }

        const res = await bulkImportTransactions(toAdd);
        if (res.error) {
          setTxImportNotice(`Import failed: ${res.error.message}`);
        } else {
          setTxImportNotice(
            isBangla
              ? `সফলভাবে ${formatNumber(res.count)} টি হিসাব টারসো ক্লাউডে আপলোড হয়েছে!`
              : `Successfully imported ${res.count} transactions to Turso!`
          );
          setTimeout(() => setTxImportNotice(null), 5000);
        }
      } catch (err) {
        setTxImportNotice(`CSV parse error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copySqlSchema = () => {
    const sql = `-- Turso SQLite schema for Hazee Travels (Leyland 121315)
CREATE TABLE IF NOT EXISTS daily_transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount REAL NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  owner TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  description TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_date ON daily_transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_type ON daily_transactions (type);
CREATE INDEX IF NOT EXISTS idx_tx_category ON daily_transactions (category);
CREATE INDEX IF NOT EXISTS idx_inv_date ON investments (date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_owner ON investments (owner);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <span>{t('navSettings')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isBangla
            ? 'ব্যবসার বিবরণ, টারসো ডাটাবেজ সংযোগ, ব্যাকআপ ও সিএসভি ব্যবস্থাপনা'
            : 'Business details, Turso database connection, data backups, and CSV import architecture'}
        </p>
      </div>

      {/* Business Details Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              HAZEE TRAVELS
            </h2>
            <p className="text-xs text-slate-400">
              Leyland 121315 • {t('commercialBus')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 font-medium">{isBangla ? 'ব্যবসার নাম:' : 'Business Name:'}</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Hazee Travels (Leyland 121315)
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">{isBangla ? 'মুদ্রা:' : 'Operating Currency:'}</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {t('bdtCurrency')}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">{isBangla ? 'থিম নির্বাচন:' : 'Active Theme:'}</span>
            <div className="mt-1">
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition-colors min-h-[36px]"
              >
                {theme === 'light' ? (isBangla ? 'ডার্ক মোড চালু করুন' : 'Switch to Dark Mode') : (isBangla ? 'লাইট মোড চালু করুন' : 'Switch to Light Mode')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Owner Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isBangla ? 'মালিক ও অপারেটর প্রোফাইল' : 'Partner Ownership Profile'}
              </h2>
              <p className="text-xs text-slate-400">
                {isBangla ? 'বর্তমানে যে মালিকের নামে হিসাব জমা হচ্ছে' : 'Current active operator logging transactions'}
              </p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
            {t('signedInAs')}: {activeOwnerName === 'Radwan' && isBangla ? 'রেদোয়ান' : activeOwnerName === 'Walid' && isBangla ? 'ওয়ালিদ' : activeOwnerName}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {isBangla ? 'সক্রিয় অপারেটর পরিবর্তন:' : 'Switch Active Partner:'}
          </span>
          {['Walid', 'Radwan'].map((b) => (
            <button
              key={b}
              onClick={() => setActiveOwnerName(b)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all min-h-[36px] ${
                activeOwnerName.toLowerCase() === b.toLowerCase()
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {b === 'Radwan' && isBangla ? 'রেদোয়ান' : b === 'Walid' && isBangla ? 'ওয়ালিদ' : b}
            </button>
          ))}
        </div>
      </div>

      {/* Turso Database Connection Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{isBangla ? 'টারসো ক্লাউড ডাটাবেজ (libSQL)' : 'Turso Cloud SQLite Database (libSQL)'}</span>
                {isLive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> {t('tursoConnected')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold border border-amber-200">
                    <AlertCircle className="w-3 h-3" /> {t('localStorageMode')}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Host: <code className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">hazeebus-prachuforwalid.aws-ap-south-1.turso.io</code>
              </p>
            </div>
          </div>

          <button
            onClick={copySqlSchema}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 min-h-[36px]"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied SQL!' : (isBangla ? 'SQL স্কিমা কপি' : 'Copy SQL Schema')}</span>
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-400">
          {isBangla
            ? 'সকল আর্থিক লেনদেন ও বিনিয়োগ সরাসরি আপনার টারসো ক্লাউড ডাটাবেজে সংরক্ষিত হয়। যেকোনো মোবাইল ও কম্পিউটার থেকে রিয়েলটাইমে ডেটা সিঙ্ক হয়।'
            : 'All financial data is stored directly in your cloud Turso database. Tables and indexes are auto-managed and synchronized with low latency across devices.'}
        </div>
      </div>

      {/* Data Import & Export Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isBangla ? 'ডেটা ব্যাকআপ ও এক্সপোর্ট/ইমপোর্ট' : 'Data Import & Export Architecture'}
            </h2>
            <p className="text-xs text-slate-400">
              {isBangla ? 'এক্সেল বা সিএসভি ফাইলে ব্যাকআপ নিন বা পূর্বের ডেটা আপলোড করুন' : 'Export CSV backups or import your real bus and investment records'}
            </p>
          </div>
        </div>

        {txImportNotice && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 text-xs rounded-xl border border-blue-200 dark:border-blue-900">
            {txImportNotice}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* Export Transactions */}
          <button
            onClick={handleExportTransactions}
            className="flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{isBangla ? 'দৈনিক হিসাব ডাউনলোড (CSV)' : 'Export Transactions (CSV)'}</span>
          </button>

          {/* Export Investments */}
          <button
            onClick={handleExportInvestments}
            className="flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{isBangla ? 'বিনিয়োগ হিসাব ডাউনলোড (CSV)' : 'Export Investments (CSV)'}</span>
          </button>

          {/* Import Transactions CSV */}
          <label className="flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer min-h-[44px]">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{isBangla ? 'হিসাব আপলোড (CSV)' : 'Import Transactions (CSV)'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleTransactionCsvUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Demo Data / Clear Local Data */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isBangla ? 'ডাটাবেজ পরিষ্কার বা ডেমো ডেটা' : 'Database Maintenance'}
          </h2>
          <p className="text-xs text-slate-400">
            {isBangla
              ? `বর্তমান তথ্য: ${formatNumber(transactions.length)} টি দৈনিক হিসাব, ${formatNumber(investments.length)} টি বিনিয়োগ`
              : `Current records: ${transactions.length} daily transactions, ${investments.length} investments`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={loadSampleDemoData}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 min-h-[40px]"
          >
            {isBangla ? 'ডেমো নমুনা তথ্য লোড করুন' : 'Load Sample Demonstration Data'}
          </button>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900 min-h-[40px]"
          >
            {isBangla ? 'সব রেকর্ড মুছে ফেলুন' : 'Clear All Records'}
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title={isBangla ? 'সব আর্থিক তথ্য মুছে ফেলবেন?' : 'Clear All Financial Data?'}
        message={
          isBangla
            ? 'এটি টারসো ক্লাউড ডাটাবেজ থেকে সমস্ত লেনদেন ও বিনিয়োগ মুছে ফেলবে। ডাটাবেজ পুরোপুরি খালি হয়ে যাবে।'
            : 'This will remove all stored transactions and investments from Turso. Your database will be completely empty.'
        }
        confirmLabel={isBangla ? 'হ্যাঁ, সব মুছে ফেলুন' : 'Yes, Clear All'}
        cancelLabel={t('cancel')}
        onConfirm={async () => {
          await clearAllLocalData();
          setIsClearModalOpen(false);
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
