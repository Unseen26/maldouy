import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Star, MapPin, MessageCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
  banner_image: string | null;
}

const FeaturedProviders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    fetchFeaturedProviders();

    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchFeaturedProviders = async () => {
    try {
      const { data: providersData, error } = await sb
        .from("provider_profiles")
        .select(`*`)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;

      if (mounted.current) {
        setProviders(providersData || []);
      }
    } catch (error: any) {
      toast.error("Error al cargar los proveedores");
      console.error(error);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const handleContactClick = async (provider: ProviderProfile) => {
    if (!user) {
      toast.error("Debes iniciar sesión para contactar");
      navigate("/auth");
      return;
    }

    try {
      const { data: existingConv, error: searchError } = await sb
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${provider.user_id}),and(participant1_id.eq.${provider.user_id},participant2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingConv) {
        navigate("/messages");
        return;
      }

      const { error: createError } = await sb.from("conversations").insert({
        participant1_id: user.id,
        participant2_id: provider.user_id,
      });

      if (createError) throw createError;

      navigate("/messages");
      toast.success("Conversación iniciada");
    } catch (error: any) {
      toast.error("Error al iniciar conversación");
      console.error(error);
    }
  };

  const viewPublications = async (providerId: string) => {
    try {
      const { data, error } = await sb
        .from("service_publications")
        .select("id")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        navigate(`/publication/${data.id}`);
      } else {
        toast.info("Este proveedor no tiene publicaciones activas");
      }
    } catch (error: any) {
      console.error("Error en viewPublications:", error);
      toast.error("Error al cargar publicación");
    }
  };

const displayName = (provider: ProviderProfile) => {
  return provider.business_name || "Proveedor";
};

  if (loading) {
    return (
      <section id="proveedores" className="py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center">
            <p className="text-muted-foreground">Cargando proveedores...</p>
          </div>
        </div>
      </section>
    );
  }

  if (providers.length === 0) {
    return null;
  }
  return (
    <section id="proveedores" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Proveedores destacados
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Profesionales verificados con excelentes calificaciones
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-card-hover cursor-pointer"
              onClick={() => navigate(`/provider-public-profile/${provider.id}`)}
            >
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {provider.banner_image ? (
                  <img 
                    src={provider.banner_image} 
                    alt={`Banner de ${displayName(provider)}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl font-bold text-primary/20">
                    {displayName(provider).charAt(0).toUpperCase()}
                  </div>
                )}
                {provider.is_verified && (
                  <div className="absolute top-3 right-3 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verificado
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-lg mb-1">{displayName(provider)}</h3>
                
                {provider.categories && provider.categories.length > 0 && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {provider.categories[0]}
                  </p>
                )}

                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">{provider.rating || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ({provider.review_count || 0} reseñas)
                  </span>
                </div>

                {provider.service_area && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    {provider.service_area}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/provider/${provider.id}/review`);
                    }}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Dejar reseña
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-hero hover:opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactClick(provider);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Contactar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/providers?category=all")}
          >
            Ver todos los proveedores
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProviders;
