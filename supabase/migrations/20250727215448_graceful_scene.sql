/*
  # Create notifications table

  1. New Tables
    - `notifications` table for user notifications
    
  2. Security
    - Enable RLS on notifications table
    - Add policies for authenticated users to manage own notifications
    
  3. Indexes
    - Add indexes for better performance
*/

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

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);