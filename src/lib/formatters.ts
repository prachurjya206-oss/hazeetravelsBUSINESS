/**
 * Currency and Date formatters for Hazee Travels / Leyland 121315 Bookkeeping
 * Primary Currency: Bangladeshi Taka (BDT - ৳)
 */

export const CURRENCY_SYMBOL = '৳';

const BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBanglaDigits(str: string): string {
  return str.replace(/[0-9]/g, (d) => BN_DIGITS[d] || d);
}

/**
 * Format a number into BDT (৳) currency representation.
 * Supports standard locale formatting with optional decimals and Bangla digits.
 */
export function formatBDT(
  amount: number,
  showDecimals: boolean = false,
  isBangla: boolean = false
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${CURRENCY_SYMBOL} ${isBangla ? '০' : '0'}`;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  const displayDigits = isBangla ? toBanglaDigits(formatted) : formatted;
  return `${isNegative ? '-' : ''}${CURRENCY_SYMBOL} ${displayDigits}`;
}

/**
 * Format compact numbers (e.g. ৳ 1.2M, ৳ 85K) for small screens or chart tooltips
 */
export function formatCompactBDT(amount: number, isBangla: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${CURRENCY_SYMBOL} ${isBangla ? '০' : '0'}`;
  }

  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (abs >= 10000000) {
    const val = (abs / 10000000).toFixed(2);
    formatted = `${isBangla ? toBanglaDigits(val) : val} ${isBangla ? 'কোটি' : 'Cr'}`;
  } else if (abs >= 100000) {
    const val = (abs / 100000).toFixed(2);
    formatted = `${isBangla ? toBanglaDigits(val) : val} ${isBangla ? 'লাখ' : 'Lac'}`;
  } else if (abs >= 1000) {
    const val = (abs / 1000).toFixed(1);
    formatted = `${isBangla ? toBanglaDigits(val) : val}k`;
  } else {
    return formatBDT(amount, false, isBangla);
  }

  return `${isNegative ? '-' : ''}${CURRENCY_SYMBOL} ${formatted}`;
}

/**
 * Format date into readable string: e.g. "20 Sep 2026"
 */
export function formatDate(dateString: string, isBangla: boolean = false): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    if (isBangla) {
      const bnMonths = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      return `${toBanglaDigits(String(day))} ${bnMonths[month - 1]} ${toBanglaDigits(String(year))}`;
    }

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Return current date in YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];
