/*
  # Fix Database Functions and Security

  1. Functions
    - Add missing handle_updated_at function
    - Add check_rate_limit function
    - Add audit_trigger function
    - Add monitor_security_events function
    - Add delete_user function

  2. Security
    - Ensure all functions are properly secured
    - Add proper error handling
    - Add rate limiting support
*/

-- Create or replace the handle_updated_at function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the check_rate_limit function
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier text,
  action_name text,
  max_requests integer,
  window_seconds integer
) RETURNS boolean AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  -- Calculate window start time
  window_start := now() - (window_seconds || ' seconds')::interval;
  
  -- Get current count for this identifier and action in the time window
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM rate_limits
  WHERE identifier = $1 
    AND action = $2 
    AND window_start >= $3;
  
  -- Check if limit exceeded
  IF current_count >= max_requests THEN
    RETURN false;
  END IF;
  
  -- Insert or update rate limit record
  INSERT INTO rate_limits (identifier, action, count, window_start)
  VALUES ($1, $2, 1, date_trunc('minute', now()))
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the audit_trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert audit log entry
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the monitor_security_events function
CREATE OR REPLACE FUNCTION monitor_security_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Log security-relevant events
  -- This is a placeholder for security monitoring
  -- In production, you might want to log to a separate security table
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the delete_user function
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Delete user data in correct order (respecting foreign keys)
  DELETE FROM notifications WHERE user_id = current_user_id;
  DELETE FROM expenses WHERE user_id = current_user_id;
  DELETE FROM reminders WHERE user_id = current_user_id;
  DELETE FROM invoices WHERE user_id = current_user_id;
  DELETE FROM clients WHERE user_id = current_user_id;
  DELETE FROM profiles WHERE id = current_user_id;
  DELETE FROM audit_logs WHERE user_id = current_user_id;
  
  -- Delete from auth.users (this will cascade to other tables)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION audit_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION monitor_security_events() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;