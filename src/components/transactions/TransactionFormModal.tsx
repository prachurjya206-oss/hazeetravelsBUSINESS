import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import type {
  DailyTransaction,
  TransactionFormData,
  TransactionType,
} from '../../types/transaction';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../../types/transaction';
import { getTodayString, CURRENCY_SYMBOL } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<{ error: Error | null }>;
  initialData?: DailyTransaction | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);
  const { lang, t } = useLanguage();
  const isBangla = lang === 'bn';

  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>(getTodayString());
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Fuel');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setDate(initialData.date);
      setAmount(String(initialData.amount));
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
    } else {
      setType('expense');
      setDate(getTodayString());
      setAmount('');
      setCategory('Fuel');
      setDescription('');
      setNotes('');
    }
    setFormError(null);
  }, [initialData, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('Daily Collection');
    } else {
      setCategory('Fuel');
    }
  };

  const getCategoryLabel = (cat: string) => {
    if (!isBangla) return cat;
    switch (cat) {
      case 'Fuel': return 'ডিজেল / জ্বালানি';
      case 'Driver/Helper': return 'ড্রাইভার / হেল্পার';
      case 'Maintenance': return 'রক্ষণাবেক্ষণ';
      case 'Repair': return 'মেরামত';
      case 'Toll': return 'টোল / পুল';
      case 'Food': return 'স্টাফ খাবার';
      case 'Other': return 'অন্যান্য';
      case 'Daily Collection': return 'দৈনিক কালেকশন';
      case 'Special Trip': return 'রিজার্ভ ট্রিপ';
      case 'Other Income': return 'অন্যান্য আয়';
      default: return cat;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError(isBangla ? 'অনুগ্রহ করে ০ এর বেশি সঠিক টাকার পরিমাণ দিন' : 'Please enter a valid amount greater than 0');
      return;
    }
    if (!date) {
      setFormError(isBangla ? 'তারিখ নির্বাচন করা আবশ্যক' : 'Please select a valid date');
      return;
    }
    if (!category.trim()) {
      setFormError(isBangla ? 'খাত নির্বাচন করুন' : 'Please select or specify a category');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      date,
      type,
      amount: amountNum,
      category: category.trim(),
      description: description.trim(),
      notes: notes.trim(),
    });

    setLoading(false);
    if (result.error) {
      setFormError(result.error.message);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isEditing ? t('editRecord') : t('addRecord')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              HAZEE TRAVELS • Leyland 121315
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
          {/* Type Toggle: Income vs Expense */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{t('income')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{t('expense')}</span>
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('amount')} ({CURRENCY_SYMBOL}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-black text-sm">
                  {CURRENCY_SYMBOL}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 8500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-base text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('date')} *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Category Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('category')} *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {type === 'expense'
                ? EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all min-h-[38px] ${
                        category === cat
                          ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))
                : INCOME_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all min-h-[38px] ${
                        category === cat
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
            </div>

            <input
              type="text"
              required
              placeholder={isBangla ? 'বা সরাসরি অন্য কোনো খাত লিখুন' : 'Or type custom category'}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('description')} ({isBangla ? 'ঐচ্ছিক' : 'Optional'})
            </label>
            <input
              type="text"
              placeholder={isBangla ? 'যেমন: সকালের ট্রিপের যাত্রী কালেকশন, ২০ লিটার ডিজেল' : 'e.g. Regular daily passenger trip, Diesel 20L'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[42px]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('notes')} ({isBangla ? 'ঐচ্ছিক' : 'Optional'})
            </label>
            <textarea
              rows={2}
              placeholder={isBangla ? 'যেমন: সিটি পাম্প থেকে নেওয়া, হেল্পার বোনাস অন্তর্ভুক্ত' : 'e.g. Paid at City pump, helper allowance'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[42px]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl shadow-md transition-all min-h-[42px]"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? t('saving') : t('saveRecord')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
