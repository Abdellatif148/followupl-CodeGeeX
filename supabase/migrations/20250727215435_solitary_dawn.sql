/*
  # Create reminders table

  1. New Tables
    - `reminders` table for reminder management
    
  2. Security
    - Enable RLS on reminders table
    - Add policies for authenticated users to manage own reminders
    
  3. Indexes
    - Add indexes for better performance
*/

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

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own reminders"
  ON reminders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);