-- Fix RLS policies for users table to allow proper insertion and updating

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Service role can update users" ON public.users;

-- Create policy to allow users to see only their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy to allow service_role to insert users
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);

-- Create policy to allow service_role to update users
CREATE POLICY "Service role can update users" ON public.users
  FOR UPDATE TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;