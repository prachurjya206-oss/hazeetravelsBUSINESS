import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { InvestmentRecord, InvestmentFormData } from '../../types/investment';
import { getTodayString, CURRENCY_SYMBOL } from '../../lib/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface InvestmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvestmentFormData) => Promise<{ error: Error | null }>;
  initialData?: InvestmentRecord | null;
}

export const InvestmentFormModal: React.FC<InvestmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { lang, t } = useLanguage();
  const isBangla = lang === 'bn';
  const isEditing = Boolean(initialData);

  const [date, setDate] = useState<string>(getTodayString());
  const [owner, setOwner] = useState<string>('Walid');
  const [customOwner, setCustomOwner] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setAmount(String(initialData.amount));
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');

      if (initialData.owner === 'Walid' || initialData.owner === 'Radwan') {
        setOwner(initialData.owner);
        setCustomOwner('');
      } else {
        setOwner('Custom');
        setCustomOwner(initialData.owner);
      }
    } else {
      setDate(getTodayString());
      setOwner('Walid');
      setCustomOwner('');
      setAmount('');
      setDescription('');
      setNotes('');
    }
    setFormError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError(isBangla ? 'অনুগ্রহ করে ০ এর চেয়ে বেশি টাকার পরিমাণ লিখুন' : 'Please enter a valid investment amount greater than 0');
      return;
    }
    if (!date) {
      setFormError(isBangla ? 'অনুগ্রহ করে সঠিক তারিখ নির্বাচন করুন' : 'Please select a valid date');
      return;
    }

    const finalOwner = owner === 'Custom' ? customOwner.trim() : owner;
    if (!finalOwner) {
      setFormError(isBangla ? 'মালিকের নাম আবশ্যক' : 'Owner name is required');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      date,
      owner: finalOwner,
      amount: amountNum,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isEditing
                ? (isBangla ? 'বিনিয়োগ পরিবর্তন করুন' : 'Edit Capital Investment')
                : (isBangla ? 'নতুন মূলধন বিনিয়োগ যোগ' : 'Record Capital Investment')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isBangla
                ? 'মালিকদের মূলধন (দৈনিক ট্রিপের পরিচালন লাভ কমায় না)'
                : 'Owner equity and capital injections (isolated from operating profit)'}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Owner Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('investingOwner')} *
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['Walid', 'Radwan', 'Custom'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOwner(opt)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                    owner === opt
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt === 'Custom' ? (isBangla ? 'অন্যান্য' : 'Custom') : opt === 'Radwan' && isBangla ? 'রেদোয়ান' : opt === 'Walid' && isBangla ? 'ওয়ালিদ' : opt}
                </button>
              ))}
            </div>

            {owner === 'Custom' && (
              <input
                type="text"
                required
                placeholder={isBangla ? 'মালিকের পুরো নাম লিখুন' : 'Enter owner full name'}
                value={customOwner}
                onChange={(e) => setCustomOwner(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
              />
            )}
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('amount')} ({CURRENCY_SYMBOL}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">
                  {CURRENCY_SYMBOL}
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('investmentPurpose')}
            </label>
            <input
              type="text"
              placeholder={isBangla ? 'যেমন: বাস ক্রয়, চেসিস পরিবর্তন, ইঞ্জিন ওভারহলিং' : 'e.g. Vehicle purchase, chassis overhaul, major registration'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('notes')}
            </label>
            <textarea
              rows={2}
              placeholder={isBangla ? 'যেমন: ব্যাংক ট্রান্সফার, নগদ জমা বা চেক নম্বর' : 'e.g. Bank transfer ref #1234, cash deposit'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm transition-all min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>
                {loading
                  ? t('saving')
                  : isEditing
                  ? (isBangla ? 'আপডেট করুন' : 'Update Investment')
                  : (isBangla ? 'সংরক্ষণ করুন' : 'Save Investment')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
