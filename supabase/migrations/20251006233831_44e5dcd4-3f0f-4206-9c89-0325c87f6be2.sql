-- Fix Security Definer view to use security_invoker
-- This prevents bypassing RLS policies on the profiles table

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT 
  id, 
  full_name, 
  location, 
  created_at
FROM public.profiles;

-- Add RLS policy to profiles table to allow users to view profiles of conversation participants
CREATE POLICY "Users can view profiles of conversation participants"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE (
      (conversations.participant1_id = auth.uid() AND conversations.participant2_id = profiles.id)
      OR
      (conversations.participant2_id = auth.uid() AND conversations.participant1_id = profiles.id)
    )
  )
);

-- Add server-side validation trigger for review comments
-- Prevents storing malicious content or excessively long comments
CREATE OR REPLACE FUNCTION public.validate_review_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate comment length (server-side enforcement)
  IF NEW.comment IS NOT NULL THEN
    NEW.comment := trim(NEW.comment);
    
    IF length(NEW.comment) > 500 THEN
      RAISE EXCEPTION 'Comment exceeds maximum length of 500 characters';
    END IF;
    
    -- Reject comments with suspicious URL patterns
    IF NEW.comment ~* '(https?://|www\.|ftp://|ftps://)' THEN
      RAISE EXCEPTION 'Comments cannot contain URLs';
    END IF;
    
    -- Reject empty comments (only whitespace)
    IF length(NEW.comment) = 0 THEN
      NEW.comment := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_comment_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_comment();