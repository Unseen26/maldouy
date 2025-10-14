import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
import Navbar from '@/components/Navbar';
import ReviewForm from '@/components/ReviewForm';
import ReviewsList from '@/components/ReviewsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Provider {
  id: string;
  business_name: string;
  rating: number;
  review_count: number;
}

const ProviderReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    try {
      const { data, error } = await sb
        .from('provider_profiles')
        .select('id, business_name, rating, review_count')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setProvider(data);
    } catch (error) {
      console.error('Error fetching provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    fetchProvider();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 py-12">
          <p className="text-center text-muted-foreground">Proveedor no encontrado</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/providers')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a proveedores
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {provider.business_name}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">
                {provider.rating > 0 ? provider.rating.toFixed(1) : 'Sin calificaciones'}
              </span>
            </div>
            {provider.review_count > 0 && (
              <span>({provider.review_count} reseñas)</span>
            )}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Dejar una reseña</h2>
            <ReviewForm
              providerId={provider.id}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Reseñas de clientes</h2>
            <ReviewsList providerId={provider.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProviderReview;
