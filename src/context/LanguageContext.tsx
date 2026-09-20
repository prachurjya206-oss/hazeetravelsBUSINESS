import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  formatNumber: (value: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Bangla digits map
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

export const translations: Record<string, { en: string; bn: string }> = {
  // Brand & General
  appName: { en: 'HAZEE TRAVELS', bn: 'হাজী ট্রাভেলস' },
  appSubtitle: { en: 'Leyland 121315 Bookkeeping', bn: 'লেল্যান্ড ১২১৩১৫ দৈনিক হিসাব-নিকাশ' },
  commercialBus: { en: 'Commercial Passenger Transport', bn: 'যাত্রীবাহী লোকাল বাস সার্ভিস' },
  bdtCurrency: { en: 'BDT (৳)', bn: 'টাকা (৳)' },

  // Navigation
  navDashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  navTransactions: { en: 'Daily Records', bn: 'দৈনিক জমা-খরচ' },
  navInvestments: { en: 'Investments', bn: 'মালিকের মূলধন' },
  navReports: { en: 'Reports', bn: 'হিসাব রিপোর্ট' },
  navSettings: { en: 'Settings', bn: 'সেটিংস' },
  signOut: { en: 'Sign Out', bn: 'লগআউট' },
  signedInAs: { en: 'Signed in as', bn: 'লগইন আছেন' },

  // Filters
  filter: { en: 'Filter', bn: 'ফিল্টার' },
  today: { en: 'Today', bn: 'আজকের হিসাব' },
  thisWeek: { en: 'This Week', bn: 'এই সপ্তাহ' },
  thisMonth: { en: 'This Month', bn: 'চলতি মাস' },
  thisYear: { en: 'This Year', bn: 'এই বছর' },
  allTime: { en: 'All Time', bn: 'সব সময়ের হিসাব' },
  custom: { en: 'Custom', bn: 'নির্দিষ্ট তারিখ' },
  year: { en: 'Year', bn: 'বছর' },
  month: { en: 'Month', bn: 'মাস' },
  fromDate: { en: 'From', bn: 'শুরুর তারিখ' },
  toDate: { en: 'To', bn: 'শেষ তারিখ' },
  resetFilter: { en: 'Reset', bn: 'ফিল্টার মুছুন' },

  // Dashboard Cards
  totalIncome: { en: 'Total Income', bn: 'মোট জমা (আয়)' },
  totalExpenses: { en: 'Total Expenses', bn: 'মোট পরিচালন খরচ' },
  netProfit: { en: 'Net Operating Profit', bn: 'নিট লাভ (হাতে জমা)' },
  totalInvestment: { en: 'Total Investment', bn: 'মোট ব্যবসায়িক মূলধন' },
  activeDays: { en: 'Active Days', bn: 'বাস চলার দিন' },
  avgDailyIncome: { en: 'Avg Daily Income', bn: 'দৈনিক গড় জমা' },
  avgDailyExpense: { en: 'Avg Daily Expense', bn: 'দৈনিক গড় খরচ' },
  profitable: { en: 'Profitable', bn: 'লাভে আছে' },
  deficit: { en: 'Deficit', bn: 'লোকসান / ঘাটতি' },
  capitalEquity: { en: 'Capital Equity', bn: 'দুই ভাইয়ের শেয়ার' },
  perOperatingDay: { en: 'per operating day', bn: 'প্রতি চলতি দিনে' },

  // Charts
  chartIncomeVsExpense: { en: 'Daily Income vs Expenses', bn: 'দৈনিক জমা বনাম খরচ' },
  chartMonthlyProfit: { en: 'Monthly Net Profit', bn: 'মাসিক নিট লাভ' },
  chartExpenseBreakdown: { en: 'Expense Breakdown by Category', bn: 'কোথায় কত টাকা খরচ হলো' },
  recentTransactions: { en: 'Recent Transactions', bn: 'সাম্প্রতিক জমা-খরচ' },
  viewAll: { en: 'View All Records', bn: 'সব হিসাব দেখুন' },

  // Transaction Fields & Types
  income: { en: 'Income (Collection)', bn: 'জমা (ভাড়া কালেকশন)' },
  expense: { en: 'Expense (Operating)', bn: 'খরচ (তেল ও অন্যান্য)' },
  amount: { en: 'Amount', bn: 'টাকার পরিমাণ' },
  date: { en: 'Date', bn: 'তারিখ' },
  category: { en: 'Category', bn: 'খাত' },
  description: { en: 'Description / Route', bn: 'বিবরণ / ট্রিপের তথ্য' },
  notes: { en: 'Notes', bn: 'অতিরিক্ত নোট' },
  addRecord: { en: 'Add Record', bn: 'নতুন হিসাব লিখুন' },
  addTransaction: { en: 'Add Transaction', bn: 'হিসাব যোগ করুন' },
  editRecord: { en: 'Edit Record', bn: 'হিসাব ঠিক করুন' },
  saveRecord: { en: 'Save Record', bn: 'হিসাব সেভ করুন' },
  saving: { en: 'Saving...', bn: 'সেভ হচ্ছে...' },
  cancel: { en: 'Cancel', bn: 'বাতিল' },
  delete: { en: 'Delete', bn: 'মুছে ফেলুন' },
  actions: { en: 'Actions', bn: 'অ্যাকশন' },

  // Categories
  catFuel: { en: 'Fuel', bn: 'ডিজেল / তেল' },
  catDriver: { en: 'Driver/Helper', bn: 'ড্রাইভার ও হেল্পার' },
  catMaintenance: { en: 'Maintenance', bn: 'গাড়ি সার্ভিসিং ও ওয়াশ' },
  catRepair: { en: 'Repair', bn: 'পার্টস ও মেরামত' },
  catToll: { en: 'Toll', bn: 'রাস্তা ও ব্রিজের টোল' },
  catFood: { en: 'Food', bn: 'স্টাফদের খোরাকি / খাবার' },
  catOther: { en: 'Other', bn: 'বিবিধ খরচ' },
  catDailyCollection: { en: 'Daily Collection', bn: 'দৈনিক ট্রিপ ভাড়া কালেকশন' },
  catSpecialTrip: { en: 'Special Trip', bn: 'রিজার্ভ বা চুক্তি ট্রিপ' },
  catOtherIncome: { en: 'Other Income', bn: 'অন্যান্য প্রাপ্তি' },

  // Investments
  capitalInvestments: { en: 'Capital Investments', bn: 'মালিকের মূলধন বিনিয়োগ' },
  recordInvestment: { en: 'Record Investment', bn: 'মূলধন যোগ করুন' },
  investingOwner: { en: 'Investing Owner', bn: 'বিনিয়োগকারী পার্টনার' },
  investmentPurpose: { en: 'Investment Purpose', bn: 'কী বাবদ বিনিয়োগ' },
  partnershipEquity: { en: 'Partnership Equity Share', bn: 'দুই ভাইয়ের শেয়ার অনুপাত' },
  isolatedCapitalNotice: {
    en: 'Investments represent partner equity for vehicle purchase or major upgrade. They do NOT count as operating expenses and do NOT reduce daily profit.',
    bn: 'মনে রাখবেন: গাড়ির বডি, ইঞ্জিন কেনা বা বড় কাজের মূলধন ,পরিচালন খরচ নয়। এটি দৈনন্দিন ট্রিপের নিট লাভ থেকে কাটা যাবে না।',
  },

  // Reports
  reports: { en: 'Financial Reports', bn: 'আয়-ব্যয় ও লাভের রিপোর্ট' },
  monthlyView: { en: 'Monthly View', bn: 'মাসভিত্তিক হিসাব' },
  yearlyView: { en: 'Yearly View', bn: 'বাৎসরিক হিসাব' },
  savePicture: { en: 'Save Picture', bn: 'ছবি সেভ করুন' },
  savePdf: { en: 'Save PDF', bn: 'পিডিএফ ডাউনলোড' },
  exporting: { en: 'Exporting...', bn: 'ডাউনলোড হচ্ছে...' },
  operatingDays: { en: 'Operating Days', bn: 'বাস চলার দিন' },
  monthByMonth: { en: 'Month-by-Month Summary', bn: 'মাসিক বিস্তারিত হিসাব' },

  // Auth & Login
  ownerLogin: { en: 'Owner Sign In', bn: 'মালিকদের লগইন' },
  enterCredentials: { en: 'Enter your credentials to access Hazee Travels', bn: 'হাজী ট্রাভেলসের হিসাবে ঢুকতে পাসওয়ার্ড দিন' },
  username: { en: 'Username', bn: 'ইউজারনেম' },
  password: { en: 'Password', bn: 'পাসওয়ার্ড' },
  signInButton: { en: 'Sign In to Dashboard', bn: 'হিসাবে প্রবেশ করুন' },
  invalidCredentials: { en: 'Invalid username or password. Please try again.', bn: 'পাসওয়ার্ড সঠিক নয়, দয়া করে আবার চেষ্টা করুন।' },
  secureAccess: { en: 'Authorized Owner Access Only', bn: 'ওয়ালিদ ও রেদোয়ানের ব্যক্তিগত ব্যবহারের জন্য' },
  selectAccount: { en: 'Quick Select Partner', bn: 'কে হিসাব লিখছেন নির্বাচন করুন' },

  // Confirmation
  confirmDeleteTitle: { en: 'Delete Record?', bn: 'হিসাবটি মুছে ফেলতে চান?' },
  confirmDeleteMsg: {
    en: 'Are you sure you want to delete this record? This will immediately update your financial profit calculations.',
    bn: 'আপনি কি নিশ্চিত যে এই হিসাবটি মুছে ফেলবেন? এটি মুছে ফেললে মোট জমা ও লাভের হিসাবে প্রভাব পড়বে।',
  },

  // Database
  tursoConnected: { en: 'Turso Cloud Connected', bn: 'ক্লাউডে কানেক্টেড' },
  localStorageMode: { en: 'Local Storage Mode', bn: 'অফলাইন মোড' },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('leyland_lang') as Language) || 'bn'; // Default to Bangla for best local usability
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('leyland_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'bn' : 'en');
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[lang] || item.en || key;
  };

  const formatNumber = (value: number | string): string => {
    const str = String(value);
    if (lang === 'en') return str;
    return str.replace(/[0-9]/g, (d) => BN_DIGITS[d] || d);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
