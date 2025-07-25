-- Enable the moddatetime extension if not already enabled
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Add trigger for updated_at using Supabase's moddatetime extension
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Add expense-related functions
CREATE OR REPLACE FUNCTION get_expense_totals_by_category(
  user_id_param uuid,
  start_date_param timestamptz,
  end_date_param timestamptz
)
RETURNS TABLE (
  category text,
  total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.category,
    SUM(e.amount) as total
  FROM expenses e
  WHERE 
    e.user_id = user_id_param AND
    e.expense_date >= start_date_param AND
    e.expense_date <= end_date_param
  GROUP BY e.category
  ORDER BY total DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_expense_totals_by_client(
  user_id_param uuid,
  start_date_param timestamptz,
  end_date_param timestamptz
)
RETURNS TABLE (
  client_id uuid,
  client_name text,
  total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as client_id,
    c.name as client_name,
    SUM(e.amount) as total
  FROM expenses e
  JOIN clients c ON e.client_id = c.id
  WHERE 
    e.user_id = user_id_param AND
    e.expense_date >= start_date_param AND
    e.expense_date <= end_date_param AND
    e.client_id IS NOT NULL
  GROUP BY c.id, c.name
  ORDER BY total DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_monthly_expense_totals(
  user_id_param uuid,
  year_param integer
)
RETURNS TABLE (
  month integer,
  total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(MONTH FROM e.expense_date)::integer as month,
    SUM(e.amount) as total
  FROM expenses e
  WHERE 
    e.user_id = user_id_param AND
    EXTRACT(YEAR FROM e.expense_date) = year_param
  GROUP BY month
  ORDER BY month;
END;
$$;