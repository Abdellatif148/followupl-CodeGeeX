/*
  # Create profiles table

  1. New Tables
    - `profiles` table for user profile information
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for authenticated users to manage own profile
    
  3. Indexes
    - Add index on profiles for better performance
*/

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

-- Enable RLS
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

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);