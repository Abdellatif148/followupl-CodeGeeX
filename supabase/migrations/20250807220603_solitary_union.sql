/*
  # Enhanced Security Policies and Functions

  1. Security Enhancements
    - Add comprehensive RLS policies with additional security checks
    - Create audit logging functions
    - Add rate limiting functions
    - Enhance user deletion with proper cleanup
    - Add security triggers for monitoring

  2. New Functions
    - `audit_log()` - Log security events
    - `check_rate_limit()` - Rate limiting function
    - `delete_user()` - Secure user deletion
    - `validate_user_access()` - Enhanced access validation

  3. Security Policies
    - Enhanced RLS policies for all tables
    - Additional security checks for sensitive operations
    - Audit trail for all data modifications
*/

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- user_id, ip_address, or other identifier
  action text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, action, window_start)
);

-- Enable RLS on rate limits (admin only)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_action text,
  p_limit integer,
  p_window_minutes integer DEFAULT 60
) RETURNS boolean AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  -- Calculate window start time
  window_start := date_trunc('minute', now()) - (extract(minute from now())::integer % p_window_minutes) * interval '1 minute';
  
  -- Get current count for this window
  SELECT count INTO current_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_start = window_start;
  
  -- If no record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO rate_limits (identifier, action, count, window_start)
    VALUES (p_identifier, p_action, 1, window_start)
    ON CONFLICT (identifier, action, window_start)
    DO UPDATE SET count = rate_limits.count + 1;
    RETURN true;
  END IF;
  
  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE rate_limits
  SET count = count + 1
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_start = window_start;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate user access
CREATE OR REPLACE FUNCTION validate_user_access(
  p_resource_type text,
  p_resource_id uuid
) RETURNS boolean AS $$
DECLARE
  resource_user_id uuid;
BEGIN
  -- Get the user_id of the resource
  CASE p_resource_type
    WHEN 'client' THEN
      SELECT user_id INTO resource_user_id FROM clients WHERE id = p_resource_id;
    WHEN 'reminder' THEN
      SELECT user_id INTO resource_user_id FROM reminders WHERE id = p_resource_id;
    WHEN 'invoice' THEN
      SELECT user_id INTO resource_user_id FROM invoices WHERE id = p_resource_id;
    WHEN 'expense' THEN
      SELECT user_id INTO resource_user_id FROM expenses WHERE id = p_resource_id;
    WHEN 'profile' THEN
      SELECT id INTO resource_user_id FROM profiles WHERE id = p_resource_id;
    ELSE
      RETURN false;
  END CASE;
  
  -- Check if current user owns the resource
  RETURN resource_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure user deletion function
CREATE OR REPLACE FUNCTION delete_user() RETURNS void AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Log the deletion attempt
  PERFORM audit_log('delete_user_attempt', 'user', current_user_id);
  
  -- Delete user data in correct order (respecting foreign keys)
  DELETE FROM audit_logs WHERE user_id = current_user_id;
  DELETE FROM notifications WHERE user_id = current_user_id;
  DELETE FROM expenses WHERE user_id = current_user_id;
  DELETE FROM invoices WHERE user_id = current_user_id;
  DELETE FROM reminders WHERE user_id = current_user_id;
  DELETE FROM clients WHERE user_id = current_user_id;
  DELETE FROM profiles WHERE id = current_user_id;
  
  -- Delete from auth.users (this will cascade to other tables)
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Log successful deletion
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
  VALUES (current_user_id, 'user_deleted', 'user', current_user_id, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for clients table
DROP POLICY IF EXISTS "Users can manage own clients" ON clients;

CREATE POLICY "Users can view own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'view_clients', 100, 60)
  );

CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'create_client', 10, 60)
  );

CREATE POLICY "Users can update own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'update_client', 30, 60)
  );

CREATE POLICY "Users can delete own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'delete_client', 10, 60)
  );

-- Enhanced RLS policies for reminders table
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;

CREATE POLICY "Users can view own reminders"
  ON reminders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'view_reminders', 100, 60)
  );

CREATE POLICY "Users can insert own reminders"
  ON reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'create_reminder', 20, 60)
  );

CREATE POLICY "Users can update own reminders"
  ON reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'update_reminder', 30, 60)
  );

CREATE POLICY "Users can delete own reminders"
  ON reminders
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'delete_reminder', 10, 60)
  );

-- Enhanced RLS policies for invoices table
DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices;

CREATE POLICY "Users can view own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'view_invoices', 100, 60)
  );

CREATE POLICY "Users can insert own invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'create_invoice', 20, 60)
  );

CREATE POLICY "Users can update own invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'update_invoice', 30, 60)
  );

CREATE POLICY "Users can delete own invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'delete_invoice', 10, 60)
  );

-- Enhanced RLS policies for expenses table
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

CREATE POLICY "Users can view own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'view_expenses', 100, 60)
  );

CREATE POLICY "Users can insert own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'create_expense', 30, 60)
  );

CREATE POLICY "Users can update own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'update_expense', 30, 60)
  );

CREATE POLICY "Users can delete own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'delete_expense', 10, 60)
  );

-- Enhanced RLS policies for notifications table
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    check_rate_limit(auth.uid()::text, 'view_notifications', 100, 60)
  );

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create audit triggers for all tables
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM audit_log(TG_OP, TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM audit_log(TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM audit_log(TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to all tables
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_reminders_trigger ON reminders;
CREATE TRIGGER audit_reminders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reminders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_invoices_trigger ON invoices;
CREATE TRIGGER audit_invoices_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses;
CREATE TRIGGER audit_expenses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Create function to clean up old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_audit_logs() RETURNS void AS $$
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM audit_logs 
  WHERE created_at < now() - interval '1 year';
  
  -- Delete old rate limit records
  DELETE FROM rate_limits 
  WHERE created_at < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate input data
CREATE OR REPLACE FUNCTION validate_input_data(
  p_table_name text,
  p_data jsonb
) RETURNS boolean AS $$
BEGIN
  -- Basic validation for all tables
  IF p_data ? 'user_id' AND NOT (p_data->>'user_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') THEN
    RETURN false;
  END IF;
  
  -- Table-specific validations
  CASE p_table_name
    WHEN 'clients' THEN
      -- Validate client name length
      IF p_data ? 'name' AND (length(p_data->>'name') < 1 OR length(p_data->>'name') > 100) THEN
        RETURN false;
      END IF;
      
      -- Validate email format if provided
      IF p_data ? 'email' AND p_data->>'email' IS NOT NULL AND NOT (p_data->>'email' ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$') THEN
        RETURN false;
      END IF;
      
    WHEN 'invoices' THEN
      -- Validate amount
      IF p_data ? 'amount' AND (p_data->>'amount')::numeric <= 0 THEN
        RETURN false;
      END IF;
      
    WHEN 'expenses' THEN
      -- Validate amount
      IF p_data ? 'amount' AND (p_data->>'amount')::numeric <= 0 THEN
        RETURN false;
      END IF;
  END CASE;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security monitoring function
CREATE OR REPLACE FUNCTION monitor_security_events() RETURNS trigger AS $$
BEGIN
  -- Monitor for suspicious activity patterns
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check for rapid successive operations
    IF (
      SELECT count(*) 
      FROM audit_logs 
      WHERE user_id = auth.uid() 
        AND action = TG_OP 
        AND resource_type = TG_TABLE_NAME
        AND created_at > now() - interval '1 minute'
    ) > 10 THEN
      -- Log suspicious activity
      PERFORM audit_log('suspicious_activity_detected', 'security', NULL, NULL, 
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'rapid_operations', true
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add security monitoring triggers
CREATE TRIGGER security_monitor_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION monitor_security_events();

CREATE TRIGGER security_monitor_reminders
  AFTER INSERT OR UPDATE OR DELETE ON reminders
  FOR EACH ROW EXECUTE FUNCTION monitor_security_events();

CREATE TRIGGER security_monitor_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION monitor_security_events();

CREATE TRIGGER security_monitor_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION monitor_security_events();

-- Create function to get user statistics (for monitoring)
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  -- Only allow users to get their own stats
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT jsonb_build_object(
    'clients_count', (SELECT count(*) FROM clients WHERE user_id = p_user_id),
    'reminders_count', (SELECT count(*) FROM reminders WHERE user_id = p_user_id),
    'invoices_count', (SELECT count(*) FROM invoices WHERE user_id = p_user_id),
    'expenses_count', (SELECT count(*) FROM expenses WHERE user_id = p_user_id),
    'total_revenue', (SELECT COALESCE(sum(amount), 0) FROM invoices WHERE user_id = p_user_id AND status = 'paid'),
    'total_expenses', (SELECT COALESCE(sum(amount), 0) FROM expenses WHERE user_id = p_user_id),
    'account_created', (SELECT created_at FROM profiles WHERE id = p_user_id)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance and security
CREATE INDEX IF NOT EXISTS idx_clients_user_id_status ON clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id_status ON reminders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_category ON expenses(user_id, category);

-- Add constraints for data integrity
ALTER TABLE clients ADD CONSTRAINT clients_name_length CHECK (length(name) >= 1 AND length(name) <= 100);
ALTER TABLE clients ADD CONSTRAINT clients_email_format CHECK (email IS NULL OR email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');

ALTER TABLE invoices ADD CONSTRAINT invoices_amount_positive CHECK (amount > 0);
ALTER TABLE invoices ADD CONSTRAINT invoices_amount_reasonable CHECK (amount <= 999999999.99);

ALTER TABLE expenses ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);
ALTER TABLE expenses ADD CONSTRAINT expenses_amount_reasonable CHECK (amount <= 999999999.99);

-- Create function to clean up old data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS void AS $$
BEGIN
  -- Clean up old rate limit records
  DELETE FROM rate_limits WHERE created_at < now() - interval '7 days';
  
  -- Clean up old audit logs (keep for 2 years for compliance)
  DELETE FROM audit_logs WHERE created_at < now() - interval '2 years';
  
  -- Clean up old notifications (keep for 6 months)
  DELETE FROM notifications WHERE created_at < now() - interval '6 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;