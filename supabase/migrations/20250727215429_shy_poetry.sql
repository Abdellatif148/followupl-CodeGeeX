/*
  # Create clients table

  1. New Tables
    - `clients` table for client management
    
  2. Security
    - Enable RLS on clients table
    - Add policies for authenticated users to manage own clients
    
  3. Indexes
    - Add indexes for better performance
*/

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

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);