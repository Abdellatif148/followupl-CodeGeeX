/*
  # Add delete user function

  1. New Functions
    - `delete_user()` - Function to delete the current authenticated user and all their data
  
  2. Security
    - Function can only be called by authenticated users
    - Only deletes the calling user's own data
    - Cascading deletes handle all related data automatically
*/

-- Function to delete the current authenticated user
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users (this will cascade to all related tables)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;