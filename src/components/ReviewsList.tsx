import { useEffect, useState } from 'react';
import { Star, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client_id: string;
  is_verified: boolean;
  verification_method: string | null;
}

interface ReviewsListProps {
  providerId: string;
}

const ReviewsList = ({ providerId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [providerId]);

  const fetchReviews = async () => {
    try {
    const { data, error } = await sb
      .from('reviews')
      .select('id, rating, comment, created_at, client_id, is_verified, verification_method')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Aún no hay reseñas para este proveedor
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {review.is_verified && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" />
                    Cliente Verificado
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-foreground">{review.comment}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ReviewsList;
