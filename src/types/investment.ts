export interface InvestmentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  owner: string; // Brother 1 / Brother 2 / specific owner name
  amount: number;
  description?: string | null;
  notes?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface InvestmentFormData {
  date: string;
  owner: string;
  amount: number | string;
  description: string;
  notes: string;
}

export interface OwnerInvestmentSummary {
  owner: string;
  totalAmount: number;
  percentage: number;
  count: number;
}
