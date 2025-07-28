-- FollowUply Database Schema
-- Complete SQL schema for all tables, functions, triggers, and policies

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, language, currency, timezone, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    'USD',
    'UTC',
    'free'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- PROFILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  currency text DEFAULT 'USD',
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'super_pro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- CLIENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- REMINDERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own reminders"
  ON reminders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- INVOICES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
  is_read boolean DEFAULT false,
  action_url text,
  related_id uuid,
  related_type text CHECK (related_type IN ('client', 'reminder', 'invoice', 'expense')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =============================================
-- EXPENSES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  currency text NOT NULL,
  category text NOT NULL,
  subcategory text,
  expense_date timestamptz NOT NULL,
  payment_method text,
  tax_deductible boolean DEFAULT false,
  status text CHECK (status IN ('pending', 'approved', 'reimbursed', 'reconciled')),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =============================================

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_platform ON clients(platform);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Reminders table indexes
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_priority ON reminders(priority);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(reminder_type);

-- Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_amount ON invoices(amount);
CREATE INDEX IF NOT EXISTS idx_invoices_currency ON invoices(currency);

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_tax_deductible ON expenses(tax_deductible);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for client statistics
CREATE OR REPLACE VIEW client_stats AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.status,
  c.total_projects,
  c.total_earned,
  COUNT(DISTINCT r.id) as reminder_count,
  COUNT(DISTINCT i.id) as invoice_count,
  COALESCE(SUM(CASE WHEN i.status IN ('pending', 'unpaid', 'sent') THEN i.amount ELSE 0 END), 0) as pending_amount,
  COALESCE(SUM(CASE WHEN i.status IN ('pending', 'unpaid', 'sent') AND i.due_date < NOW() THEN i.amount ELSE 0 END), 0) as overdue_amount
FROM clients c
LEFT JOIN reminders r ON c.id = r.client_id AND r.status IN ('pending', 'active')
LEFT JOIN invoices i ON c.id = i.client_id
GROUP BY c.id, c.user_id, c.name, c.status, c.total_projects, c.total_earned;

-- View for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_clients,
  COUNT(DISTINCT CASE WHEN r.status IN ('pending', 'active') THEN r.id END) as pending_reminders,
  COUNT(DISTINCT CASE WHEN i.status IN ('pending', 'unpaid', 'sent') THEN i.id END) as pending_invoices,
  COUNT(DISTINCT CASE WHEN i.status IN ('pending', 'unpaid', 'sent') AND i.due_date < NOW() THEN i.id END) as overdue_invoices,
  COALESCE(SUM(CASE WHEN i.status IN ('pending', 'unpaid', 'sent') THEN i.amount ELSE 0 END), 0) as total_pending_amount,
  COALESCE(SUM(CASE WHEN i.status IN ('pending', 'unpaid', 'sent') AND i.due_date < NOW() THEN i.amount ELSE 0 END), 0) as total_overdue_amount,
  COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as total_paid_amount
FROM auth.users u
LEFT JOIN clients c ON u.id = c.user_id
LEFT JOIN reminders r ON u.id = r.user_id
LEFT JOIN invoices i ON u.id = i.user_id
GROUP BY u.id;

-- =============================================
-- SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- =============================================

-- Note: This section can be used to insert sample data for development/testing
-- Uncomment and modify as needed

/*
-- Sample client data
INSERT INTO clients (user_id, name, email, company, platform, status, total_projects, total_earned) VALUES
  ('user-uuid-here', 'John Doe', 'john@example.com', 'Acme Corp', 'direct', 'active', 3, 5000.00),
  ('user-uuid-here', 'Jane Smith', 'jane@example.com', 'Tech Solutions', 'upwork', 'active', 2, 3500.00);

-- Sample invoice data
INSERT INTO invoices (user_id, client_id, title, amount, currency, due_date, status) VALUES
  ('user-uuid-here', 'client-uuid-here', 'Website Development', 2500.00, 'USD', '2025-02-15', 'pending'),
  ('user-uuid-here', 'client-uuid-here', 'Logo Design', 500.00, 'USD', '2025-01-30', 'paid');
*/

-- =============================================
-- SECURITY NOTES
-- =============================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. Row Level Security (RLS) is enabled on all tables
2. All policies ensure users can only access their own data
3. Foreign key constraints maintain data integrity
4. Functions use SECURITY DEFINER where appropriate
5. Input validation is handled at the application level
6. All timestamps use timestamptz for timezone awareness

AUTHENTICATION:
- Users are managed by Supabase Auth
- Profiles are automatically created via trigger
- Session management is handled by Supabase client

PERMISSIONS:
- authenticated role: Can access own data only
- anon role: No direct table access (handled by Supabase Auth)
- service_role: Full access (for admin operations)

BACKUP RECOMMENDATIONS:
- Regular database backups via Supabase dashboard
- Export important data periodically
- Monitor database performance and usage
*/