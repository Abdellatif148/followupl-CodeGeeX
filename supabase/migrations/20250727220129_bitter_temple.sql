-- FollowUply Database Schema
-- Complete SQL schema for all tables, functions, and policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  currency text DEFAULT 'USD',
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'super_pro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  platform text DEFAULT 'direct' CHECK (platform IN ('fiverr', 'upwork', 'direct', 'other')),
  platform_profile text,
  contact_method text DEFAULT 'email' CHECK (contact_method IN ('email', 'whatsapp', 'telegram', 'discord', 'other')),
  notes text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  total_projects integer DEFAULT 0,
  total_earned numeric(10,2) DEFAULT 0,
  last_contact timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  description text,
  due_date timestamptz NOT NULL,
  datetime timestamptz,
  reminder_type text DEFAULT 'follow_up' CHECK (reminder_type IN ('follow_up', 'payment', 'project_deadline', 'custom')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed', 'cancelled', 'active', 'done')),
  is_recurring boolean DEFAULT false,
  recurring_interval text CHECK (recurring_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
  ai_suggested boolean DEFAULT false,
  completed_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Reminders policies
CREATE POLICY "Users can manage own reminders"
  ON reminders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number text,
  title text NOT NULL,
  description text,
  project text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  due_date timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled', 'unpaid')),
  payment_method text,
  payment_date timestamptz,
  late_fee numeric(10,2) DEFAULT 0,
  notes text,
  reminder_sent_count integer DEFAULT 0,
  last_reminder_sent timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
  is_read boolean DEFAULT false,
  action_url text,
  related_id uuid,
  related_type text CHECK (related_type IN ('client', 'reminder', 'invoice', 'expense')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can manage own notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  category text NOT NULL,
  subcategory text,
  expense_date timestamptz NOT NULL,
  payment_method text,
  tax_deductible boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'reimbursed', 'reconciled')),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view their own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create utility functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO profiles (id, full_name, language, currency)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    'USD'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at triggers for all tables
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_tax_deductible ON expenses(tax_deductible);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;