-- ==============================================================================
-- LEYLAND 121315 - Supabase PostgreSQL Database Schema
-- Bookkeeping and Business Financial Management
-- ==============================================================================

-- 1. Create daily_transactions table
CREATE TABLE IF NOT EXISTS public.daily_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexing for fast search, filter, and reporting
CREATE INDEX IF NOT EXISTS idx_daily_transactions_date ON public.daily_transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_transactions_type ON public.daily_transactions (type);
CREATE INDEX IF NOT EXISTS idx_daily_transactions_category ON public.daily_transactions (category);

-- 2. Create investments table (COMPLETELY SEPARATE FROM OPERATING EXPENSES)
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    owner TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexing for fast investment queries
CREATE INDEX IF NOT EXISTS idx_investments_date ON public.investments (date DESC);
CREATE INDEX IF NOT EXISTS idx_investments_owner ON public.investments (owner);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.daily_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Allow authenticated users (both authorized owners) full access
-- Read access
CREATE POLICY "Allow authenticated read daily_transactions"
    ON public.daily_transactions FOR SELECT
    TO authenticated
    USING (true);

-- Insert access
CREATE POLICY "Allow authenticated insert daily_transactions"
    ON public.daily_transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Update access
CREATE POLICY "Allow authenticated update daily_transactions"
    ON public.daily_transactions FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Delete access
CREATE POLICY "Allow authenticated delete daily_transactions"
    ON public.daily_transactions FOR DELETE
    TO authenticated
    USING (true);

-- Investments Policies
CREATE POLICY "Allow authenticated read investments"
    ON public.investments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert investments"
    ON public.investments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update investments"
    ON public.investments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete investments"
    ON public.investments FOR DELETE
    TO authenticated
    USING (true);

-- Optional: Allow public access for local development / demo if needed (comment out for production)
-- CREATE POLICY "Allow anon read daily_transactions" ON public.daily_transactions FOR SELECT TO anon USING (true);
-- CREATE POLICY "Allow anon insert daily_transactions" ON public.daily_transactions FOR INSERT TO anon WITH CHECK (true);
