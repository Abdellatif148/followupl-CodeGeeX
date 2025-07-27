/*
  # Create invoices table

  1. New Tables
    - `invoices` table for invoice management
    
  2. Security
    - Enable RLS on invoices table
    - Add policies for authenticated users to manage own invoices
    
  3. Indexes
    - Add indexes for better performance
*/

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

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);