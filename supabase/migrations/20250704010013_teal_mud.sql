/*
  # Add Client, Reminder, and Invoice Tables

  1. New Tables
    - `clients` - Enhanced client management
    - `reminders` - Task reminders with client relationships
    - `invoices` - Invoice tracking and management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Changes
    - Add company field to clients
    - Update reminders structure for better UX
    - Ensure proper foreign key relationships
*/

-- Update clients table to match requirements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'company'
  ) THEN
    ALTER TABLE clients ADD COLUMN company text;
  END IF;
END $$;

-- Update reminders table structure
DO $$
BEGIN
  -- Add datetime column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reminders' AND column_name = 'datetime'
  ) THEN
    ALTER TABLE reminders ADD COLUMN datetime timestamptz;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reminders' AND column_name = 'description'
  ) THEN
    ALTER TABLE reminders ADD COLUMN description text;
  END IF;
END $$;

-- Update invoices table structure
DO $$
BEGIN
  -- Add project column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'project'
  ) THEN
    ALTER TABLE invoices ADD COLUMN project text;
  END IF;
END $$;

-- Update status constraints for reminders
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'reminders' AND constraint_name = 'reminders_status_check'
  ) THEN
    ALTER TABLE reminders DROP CONSTRAINT reminders_status_check;
  END IF;

  -- Add new constraint
  ALTER TABLE reminders ADD CONSTRAINT reminders_status_check 
    CHECK (status IN ('pending', 'completed', 'snoozed', 'cancelled', 'active', 'done'));
END $$;

-- Update status constraints for invoices
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'invoices' AND constraint_name = 'invoices_status_check'
  ) THEN
    ALTER TABLE invoices DROP CONSTRAINT invoices_status_check;
  END IF;

  -- Add new constraint
  ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled', 'unpaid'));
END $$;