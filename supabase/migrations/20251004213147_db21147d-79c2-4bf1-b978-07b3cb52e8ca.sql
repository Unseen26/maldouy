-- Crear storage bucket para imágenes de publicaciones
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Políticas de storage para imágenes
CREATE POLICY "Imágenes públicamente accesibles"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Proveedores pueden subir sus imágenes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Proveedores pueden actualizar sus imágenes"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'service-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Proveedores pueden eliminar sus imágenes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'service-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Crear tabla de publicaciones de servicios
CREATE TABLE public.service_publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en service_publications
ALTER TABLE public.service_publications ENABLE ROW LEVEL SECURITY;

-- Políticas para service_publications
CREATE POLICY "Cualquiera puede ver publicaciones activas"
ON public.service_publications
FOR SELECT
USING (is_active = true);

CREATE POLICY "Proveedores pueden crear sus publicaciones"
ON public.service_publications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.provider_profiles
    WHERE id = provider_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Proveedores pueden actualizar sus publicaciones"
ON public.service_publications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.provider_profiles
    WHERE id = provider_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Proveedores pueden eliminar sus publicaciones"
ON public.service_publications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.provider_profiles
    WHERE id = provider_id 
    AND user_id = auth.uid()
  )
);

-- Agregar publication_id a reviews y hacer provider_id opcional
ALTER TABLE public.reviews 
ADD COLUMN publication_id UUID REFERENCES public.service_publications(id) ON DELETE CASCADE;

-- Índice para mejorar performance
CREATE INDEX idx_reviews_publication_id ON public.reviews(publication_id);
CREATE INDEX idx_service_publications_provider_id ON public.service_publications(provider_id);

-- Trigger para actualizar updated_at en service_publications
CREATE TRIGGER update_service_publications_updated_at
BEFORE UPDATE ON public.service_publications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Función mejorada para actualizar rating de publicaciones Y proveedores
CREATE OR REPLACE FUNCTION public.update_publication_and_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_publication_id UUID;
BEGIN
  v_publication_id := COALESCE(NEW.publication_id, OLD.publication_id);
  
  -- Actualizar rating de la publicación específica
  IF v_publication_id IS NOT NULL THEN
    UPDATE public.service_publications
    SET 
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE publication_id = v_publication_id
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE publication_id = v_publication_id
      )
    WHERE id = v_publication_id;
    
    -- Actualizar rating del proveedor basado en todas sus publicaciones
    UPDATE public.provider_profiles pp
    SET 
      rating = (
        SELECT COALESCE(AVG(r.rating), 0)
        FROM public.reviews r
        INNER JOIN public.service_publications sp ON r.publication_id = sp.id
        WHERE sp.provider_id = pp.id
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
END;
$$;

-- Eliminar trigger antiguo y crear el nuevo
DROP TRIGGER IF EXISTS update_provider_rating_on_review ON public.reviews;

CREATE TRIGGER update_publication_and_provider_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_publication_and_provider_rating();

-- Crear tabla de conversaciones
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant1_id, participant2_id),
  CONSTRAINT different_participants CHECK (participant1_id != participant2_id)
);

-- Habilitar RLS en conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Usuarios pueden ver sus conversaciones"
ON public.conversations
FOR SELECT
USING (
  auth.uid() = participant1_id 
  OR auth.uid() = participant2_id
);

CREATE POLICY "Usuarios pueden crear conversaciones"
ON public.conversations
FOR INSERT
WITH CHECK (
  auth.uid() = participant1_id 
  OR auth.uid() = participant2_id
);

-- Crear tabla de mensajes
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para messages
CREATE POLICY "Usuarios pueden ver mensajes de sus conversaciones"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
  )
);

CREATE POLICY "Usuarios pueden enviar mensajes en sus conversaciones"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
  )
);

-- Índices para mejor performance
CREATE INDEX idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- Trigger para actualizar last_message_at en conversations
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_last_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Habilitar realtime para mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Crear tabla de favoritos
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

-- Habilitar RLS en favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para favorites
CREATE POLICY "Usuarios pueden ver sus favoritos"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden agregar favoritos"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus favoritos"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Crear tabla de notificaciones
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Usuarios pueden ver sus notificaciones"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus notificaciones"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_provider ON public.favorites(provider_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Habilitar realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;