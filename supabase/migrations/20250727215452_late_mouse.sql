/*
  # Create expenses table

  1. New Tables
    - `expenses` table for expense tracking
    
  2. Security
    - Enable RLS on expenses table
    - Add policies for authenticated users to manage own expenses
    
  3. Indexes
    - Add indexes for better performance
*/

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

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_tax_deductible ON expenses(tax_deductible);