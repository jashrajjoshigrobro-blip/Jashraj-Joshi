-- Run this SQL in your Supabase SQL Editor to create/update all necessary tables.
-- This schema matches the frontend types exactly.

-- 1. Create custom ENUM types (if not already created)
DO $$ BEGIN
    CREATE TYPE occupancy_status AS ENUM ('Owner Occupied', 'Tenant Occupied', 'Vacant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('Income', 'Expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE parking_slot_type AS ENUM ('Car', 'Bike', 'EV', 'Visitor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE parking_allocation_status AS ENUM ('Available', 'Allocated', 'Reserved', 'Under Maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Flats table
CREATE TABLE IF NOT EXISTS flats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flat_number TEXT NOT NULL UNIQUE,
  block TEXT NOT NULL,
  floor TEXT NOT NULL,
  area NUMERIC NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  occupancy_status occupancy_status NOT NULL DEFAULT 'Vacant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flat_id UUID REFERENCES flats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Occupancy History table
CREATE TABLE IF NOT EXISTS occupancy_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flat_id UUID REFERENCES flats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Owner', 'Tenant')),
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flat_id UUID REFERENCES flats(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  mode TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Pending Dues table
CREATE TABLE IF NOT EXISTS pending_dues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flat_id UUID REFERENCES flats(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flat_id UUID REFERENCES flats(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Ledger Transactions table
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  flat_number TEXT,
  flat_id UUID REFERENCES flats(id) ON DELETE SET NULL,
  occupant_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  expense_category TEXT NOT NULL CHECK (expense_category IN ('Resident Charge', 'Society Operational Expense')),
  expense_type TEXT NOT NULL,
  description TEXT NOT NULL,
  linked_scope TEXT NOT NULL, -- Can store JSON array of flat IDs or 'All Flats'/'Society Level'
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Recorded', 'Billed', 'Settled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create Parking Slots table
CREATE TABLE IF NOT EXISTS parking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone TEXT NOT NULL,
  level TEXT NOT NULL,
  slot_number TEXT NOT NULL UNIQUE,
  slot_type parking_slot_type NOT NULL,
  status parking_allocation_status NOT NULL DEFAULT 'Available',
  allocated_to_flat_id UUID REFERENCES flats(id) ON DELETE SET NULL,
  assigned_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create Notices table
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Published')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create Admin Profile table
CREATE TABLE IF NOT EXISTS admin_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create Society Settings table
CREATE TABLE IF NOT EXISTS society_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  building_age INTEGER,
  number_of_blocks INTEGER,
  year_of_establishment INTEGER,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Setup Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (Allowing public access for now)
CREATE POLICY "Allow public access" ON flats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON occupancy_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON pending_dues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON ledger_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON parking_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON admin_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON society_settings FOR ALL USING (true) WITH CHECK (true);
