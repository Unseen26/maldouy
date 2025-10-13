-- Fix overly permissive SELECT policy on public.profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Restrict profiles visibility to the owner only
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);
