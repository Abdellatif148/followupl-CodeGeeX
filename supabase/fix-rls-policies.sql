-- Fix Row Level Security (RLS) policies for clients table

-- First, check if the policies exist and drop them if they do
DO $$
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname = 'Users can manage own clients'
    ) THEN
        DROP POLICY "Users can manage own clients" ON public.clients;
    END IF;
END
$$;

-- Create proper RLS policies for the clients table
-- Policy for SELECT operations
CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Policy for INSERT operations
CREATE POLICY "Users can add their own clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Policy for UPDATE operations
CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Policy for DELETE operations
CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Same pattern for other tables that need similar policies
-- For reminders table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reminders' 
        AND policyname = 'Users can manage own reminders'
    ) THEN
        DROP POLICY "Users can manage own reminders" ON public.reminders;
    END IF;
END
$$;

CREATE POLICY "Users can view their own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can add their own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.reminders 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- For invoices table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'invoices' 
        AND policyname = 'Users can manage own invoices'
    ) THEN
        DROP POLICY "Users can manage own invoices" ON public.invoices;
    END IF;
END
$$;

CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can add their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- For notifications table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'Users can manage own notifications'
    ) THEN
        DROP POLICY "Users can manage own notifications" ON public.notifications;
    END IF;
END
$$;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can add their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid()::text = user_id);
