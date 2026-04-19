-- ==========================================================
-- DRIVECONTROL VMS: ENTERPRISE EXTENSION SCHEMA
-- ==========================================================
-- Run this in your Supabase SQL Editor to enable all features.

-- 1. Profiles (with Roles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'worker';

-- 2. Workers (Personnel other than Drivers)
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    position TEXT NOT NULL, 
    phone TEXT,
    salary_amount DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'active', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inventory (Spare Parts / Assets)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_name TEXT NOT NULL,
    part_code TEXT UNIQUE,
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(12,2) DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sales Records (Income from Drivers)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id),
    amount DECIMAL(12,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    shift TEXT, 
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bank Transactions ( Deposits, Withdrawals, Transfers)
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('deposit', 'withdrawal')),
    amount DECIMAL(12,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    account_name TEXT DEFAULT 'Main Business Account',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Salary Payments (Historical records)
CREATE TABLE IF NOT EXISTS salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL, 
    recipient_type TEXT CHECK (recipient_type IN ('driver', 'worker')),
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_no TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Workshop/Misc Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, 
    amount DECIMAL(12,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- ENABLE RLS
-- ==========================================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
