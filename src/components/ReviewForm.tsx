import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { reviewSchema } from '@/lib/validation';

interface ReviewFormProps {
  providerId: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm = ({ providerId, onReviewSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);

  useEffect(() => {
    const checkIfOwnProfile = async () => {
      if (!user) {
        setCheckingOwnership(false);
        return;
      }

      try {
        const { data, error } = await sb
          .from('provider_profiles')
          .select('user_id')
          .eq('id', providerId)
          .single();

        if (error) throw error;
        setIsOwnProfile(data?.user_id === user.id);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error checking profile ownership:', error);
        }
      } finally {
        setCheckingOwnership(false);
      }
    };

    checkIfOwnProfile();
  }, [user, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Debes iniciar sesión para dejar una reseña');
      return;
    }

    // Validate review data
    const validation = reviewSchema.safeParse({
      rating,
      comment,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await sb.from('reviews').insert({
        provider_id: providerId,
        client_id: user.id,
        rating: validation.data.rating,
        comment: validation.data.comment || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya has calificado a este proveedor');
        } else {
          throw error;
        }
        return;
      }

      toast.success('¡Gracias por tu calificación!');
      setRating(0);
      setComment('');
      onReviewSubmitted?.();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error('Hubo un problema. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingOwnership) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Cargando...</p>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Inicia sesión para dejar una reseña
        </p>
      </Card>
    );
  }

  if (isOwnProfile) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          No puedes calificar tu propio perfil
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Tu calificación</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Comentario (opcional)</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contanos sobre tu experiencia con este proveedor..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {comment.length}/500 caracteres
          </p>
        </div>

        <Button type="submit" disabled={loading || rating === 0} className="w-full">
          {loading ? 'Enviando...' : 'Enviar calificación'}
        </Button>
      </form>
    </Card>
  );
};

export default ReviewForm;
