-- Add verification fields to reviews table
ALTER TABLE public.reviews
ADD COLUMN is_verified BOOLEAN DEFAULT false,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_method TEXT CHECK (verification_method IN ('purchase', 'service_completed', 'admin_verified'));

-- Add comment to explain the verification system
COMMENT ON COLUMN public.reviews.is_verified IS 'Indicates if the review is from a verified customer who actually used the service';
COMMENT ON COLUMN public.reviews.verification_method IS 'Method used to verify the review: purchase, service_completed, or admin_verified';