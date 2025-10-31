import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, MapPin, Star, MessageCircle, CheckCircle, Globe, Facebook, Instagram, Phone, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

const sb = supabase as any;

interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  categories: string[] | null;
  service_area: string | null;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  website: string | null;
  banner_image: string | null;
}

interface Publication {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  images: string[] | null;
  rating: number | null;
  review_count: number | null;
  provider_id: string;
  is_active: boolean | null;
}

const ProviderPublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProviderProfile(id);
      fetchProviderPublications(id);
    }
  }, [id]);

  const fetchProviderProfile = async (providerId: string) => {
    try {
      const { data, error } = await sb
        .from('provider_profiles')
        .select('*')
        .eq('id', providerId)
        .maybeSingle();

      if (error) throw error;
      setProvider(data);
    } catch (error: any) {
      toast.error('Error al cargar el perfil del proveedor');
      console.error(error);
    }
  };

  const fetchProviderPublications = async (providerId: string) => {
    try {
      const { data, error } = await sb
        .from('service_publications')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true) // Only show active publications
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublications(data || []);
    } catch (error: any) {
      toast.error('Error al cargar las publicaciones del proveedor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para enviar mensajes');
      navigate('/auth');
      return;
    }

    if (!provider) return;

    try {
      const { data: existingConv, error: searchError } = await sb
        .from('conversations')
        .select('id')
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${provider.user_id}),and(participant1_id.eq.${provider.user_id},participant2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingConv) {
        navigate('/messages');
        return;
      }

      const { error: createError } = await sb.from('conversations').insert({
        participant1_id: user.id,
        participant2_id: provider.user_id,
      });

      if (createError) throw createError;

      navigate('/messages');
      toast.success('Conversación iniciada');
    } catch (error: any) {
      toast.error('Error al iniciar conversación');
      console.error(error);
    }
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
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container px-4 py-6">
          <p className="text-center text-muted-foreground">
            Perfil de proveedor no encontrado
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {provider.banner_image && (
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img 
            src={sb.storage.from("profile-images").getPublicUrl(provider.banner_image.split("/").slice(-2).join("/")).data.publicUrl} 
            alt={`Banner de ${provider.business_name || 'Proveedor'}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>
      )}

      <main className="flex-1 container px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar o iniciales del proveedor */}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {provider.business_name ? provider.business_name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {provider.business_name || 'Proveedor sin nombre'}
                  </h1>
                  {provider.is_verified && (
                    <Badge className="bg-primary text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{provider.rating || 0}</span>
                  <span className="text-sm text-muted-foreground">
                    ({provider.review_count || 0} reseñas)
                  </span>
                </div>
                {provider.service_area && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{provider.service_area}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div>
                <h2 className="text-xl font-semibold mb-3">Sobre {provider.business_name || 'el proveedor'}</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {provider.description || 'Sin descripción disponible.'}
                </p>
              </div>
            </Card>

            {/* Publications Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Publicaciones de {provider.business_name || 'este proveedor'}</h2>
              {publications.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publications.map((pub) => (
                    <Card key={pub.id} className="overflow-hidden cursor-pointer" onClick={() => navigate(`/publication/${pub.id}`)}>
                      <div className="relative h-40 bg-primary/10 flex items-center justify-center">
                        {pub.images && pub.images.length > 0 ? (
                          <img
                            src={pub.images[0]}
                            alt={pub.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-primary/20">
                            {pub.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{pub.title}</h3>
                        {pub.category && (
                          <Badge variant="secondary" className="mb-2">{pub.category}</Badge>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">{pub.description || 'Sin descripción.'}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Este proveedor aún no tiene publicaciones activas.</p>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="space-y-3">
                {provider.whatsapp && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      const raw = provider.whatsapp!.replace(/\D/g, "");
                      const phone = raw.startsWith("598")
                        ? raw
                        : raw.startsWith("0")
                        ? "598" + raw.slice(1)
                        : "598" + raw;
                      window.open(`https://wa.me/${phone}`, "_blank");
                    }}
                  >
                    <Phone className="h-4 w-4 text-green-500" />
                    WhatsApp
                  </Button>
                )}

                {provider.instagram && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open(provider.instagram!, "_blank")}
                  >
                    <Instagram className="h-4 w-4 text-pink-500" />
                    Instagram
                  </Button>
                )}

                {provider.facebook && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open(provider.facebook!, "_blank")}
                  >
                    <Facebook className="h-4 w-4 text-blue-500" />
                    Facebook
                  </Button>
                )}

                {provider.website && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open(provider.website!, "_blank")}
                  >
                    <Globe className="h-4 w-4" />
                    Sitio web
                  </Button>
                )}
              </div>
              <Separator className="my-4" />
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleStartChat}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Iniciar Chat
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProviderPublicProfile;