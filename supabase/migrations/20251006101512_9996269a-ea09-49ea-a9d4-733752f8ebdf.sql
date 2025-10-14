-- Fix SECURITY DEFINER view warning by removing SECURITY DEFINER
-- The public_profiles view doesn't need SECURITY DEFINER since it only selects from profiles table
-- and users with appropriate permissions will be able to see the allowed columns

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  location,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;