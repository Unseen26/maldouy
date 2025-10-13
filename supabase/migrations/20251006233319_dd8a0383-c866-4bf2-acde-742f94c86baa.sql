-- Fix user_roles table INSERT policy for role assignment
CREATE POLICY "System can assign roles during signup"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: The handle_new_user function is SECURITY DEFINER, which should bypass RLS,
-- but this policy ensures role assignment works correctly in all contexts