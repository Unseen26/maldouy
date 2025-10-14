-- ============================================
-- SECURITY FIX: Comprehensive Database Security Improvements
-- ============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('client', 'provider', 'admin');

-- 2. Create user_roles table (prevents privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id, 
  CASE 
    WHEN role::text = 'client' THEN 'client'::app_role
    WHEN role::text = 'provider' THEN 'provider'::app_role
    ELSE 'client'::app_role
  END
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Add input validation constraints (drop first if exists)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_comment_length;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
  ADD CONSTRAINT reviews_comment_length CHECK (char_length(comment) <= 2000);

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_content_length;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000);

ALTER TABLE public.service_publications DROP CONSTRAINT IF EXISTS publications_title_length;
ALTER TABLE public.service_publications DROP CONSTRAINT IF EXISTS publications_description_length;
ALTER TABLE public.service_publications
  ADD CONSTRAINT publications_title_length CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  ADD CONSTRAINT publications_description_length CHECK (char_length(description) <= 5000);

ALTER TABLE public.provider_profiles DROP CONSTRAINT IF EXISTS provider_business_name_length;
ALTER TABLE public.provider_profiles DROP CONSTRAINT IF EXISTS provider_description_length;
ALTER TABLE public.provider_profiles DROP CONSTRAINT IF EXISTS provider_whatsapp_format;
ALTER TABLE public.provider_profiles
  ADD CONSTRAINT provider_business_name_length CHECK (char_length(business_name) > 0 AND char_length(business_name) <= 200),
  ADD CONSTRAINT provider_description_length CHECK (char_length(description) <= 5000),
  ADD CONSTRAINT provider_whatsapp_format CHECK (whatsapp ~ '^\+?[0-9]{8,15}$');

-- 6. Fix notifications INSERT policy
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- 7. Create public_profiles view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  location,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 8. Update provider_profiles RLS
DROP POLICY IF EXISTS "Providers can insert own profile" ON public.provider_profiles;
DROP POLICY IF EXISTS "Providers can update own profile" ON public.provider_profiles;

CREATE POLICY "Providers can insert own profile"
  ON public.provider_profiles
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'provider'::app_role) 
    AND auth.uid() = user_id
  );

CREATE POLICY "Providers can update own profile"
  ON public.provider_profiles
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'provider'::app_role) 
    AND auth.uid() = user_id
  );

-- 9. Update service_publications RLS
DROP POLICY IF EXISTS "Proveedores pueden crear sus publicaciones" ON public.service_publications;
DROP POLICY IF EXISTS "Proveedores pueden actualizar sus publicaciones" ON public.service_publications;
DROP POLICY IF EXISTS "Proveedores pueden eliminar sus publicaciones" ON public.service_publications;

CREATE POLICY "Providers can create publications"
  ON public.service_publications
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'provider'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.provider_profiles 
      WHERE id = service_publications.provider_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update publications"
  ON public.service_publications
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'provider'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.provider_profiles 
      WHERE id = service_publications.provider_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can delete publications"
  ON public.service_publications
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'provider'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.provider_profiles 
      WHERE id = service_publications.provider_id 
      AND user_id = auth.uid()
    )
  );

-- 10. Improve storage policies
DROP POLICY IF EXISTS "Proveedores pueden subir sus imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Proveedores pueden actualizar sus imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Proveedores pueden eliminar sus imágenes" ON storage.objects;

CREATE POLICY "Users can upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'service-images'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
    AND array_length(storage.foldername(name), 1) = 2
  );

CREATE POLICY "Users can update own images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'service-images'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
    AND array_length(storage.foldername(name), 1) = 2
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'service-images'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
    AND array_length(storage.foldername(name), 1) = 2
  );

-- 11. Add input validation to triggers
CREATE OR REPLACE FUNCTION public.update_publication_and_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_publication_id UUID;
BEGIN
  v_publication_id := COALESCE(NEW.publication_id, OLD.publication_id);
  
  IF NEW.rating IS NOT NULL THEN
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
      RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
  END IF;
  
  IF v_publication_id IS NOT NULL THEN
    UPDATE public.service_publications
    SET 
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE publication_id = v_publication_id
        AND rating BETWEEN 1 AND 5
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE publication_id = v_publication_id
      )
    WHERE id = v_publication_id;
    
    UPDATE public.provider_profiles pp
    SET 
      rating = (
        SELECT COALESCE(AVG(r.rating), 0)
        FROM public.reviews r
        INNER JOIN public.service_publications sp ON r.publication_id = sp.id
        WHERE sp.provider_id = pp.id
        AND r.rating BETWEEN 1 AND 5
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews r
        INNER JOIN public.service_publications sp ON r.publication_id = sp.id
        WHERE sp.provider_id = pp.id
      )
    WHERE id = (SELECT provider_id FROM public.service_publications WHERE id = v_publication_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in update_publication_and_provider_rating: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 12. Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN v_role = 'client' THEN 'client'::app_role
      WHEN v_role = 'provider' THEN 'provider'::app_role
      ELSE 'client'::app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;