-- Add RLS policy to allow service role to insert into users table
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- Add RLS policy to allow service role to update users table
DROP POLICY IF EXISTS "Service role can update users" ON public.users;
CREATE POLICY "Service role can update users"
ON public.users
FOR UPDATE
TO authenticated, service_role
USING (true);
