import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, Globe, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
  website: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  banner_image: string | null;
}

const Providers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, [category, search]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      let query = sb
        .from("provider_profiles")
        .select(`*`);

      if (category && category !== "all") {
        query = query.contains("categories", [category]);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Filter by search term if provided
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter((provider) => {
          const businessName = provider.business_name?.toLowerCase() || "";
          const description = provider.description?.toLowerCase() || "";
          const categories = provider.categories?.join(" ").toLowerCase() || "";
          
          return (
            businessName.includes(searchLower) ||
            description.includes(searchLower) ||
            categories.includes(searchLower)
          );
        });
      }

      setProviders(filteredData);
    } catch (error: any) {
      toast.error("Error al cargar los proveedores");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = (provider: ProviderProfile) => {
    return provider.business_name || "Proveedor";
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
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar publicación");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="container px-4 md:px-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {search 
                ? `Resultados para "${search}"` 
                : category && category !== "all" 
                  ? category 
                  : "Todos los proveedores"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encontrá el profesional perfecto para tu necesidad
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando proveedores...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No se encontraron proveedores en esta categoría
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-card-hover cursor-pointer"
                  onClick={() => navigate(`/provider-public-profile/${provider.id}`)}
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    {provider.banner_image ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <img 
                            src={sb.storage.from("profile-images").getPublicUrl(provider.banner_image.split("/").slice(-2).join("/")).data.publicUrl} 
                            alt={`Banner de ${displayName(provider)}`}
                            className="w-full h-full object-cover cursor-pointer"
                          />
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0">
                          <DialogTitle className="sr-only">Imagen del banner del proveedor</DialogTitle>
                          <img
                            src={sb.storage.from("profile-images").getPublicUrl(provider.banner_image.split("/").slice(-2).join("/")).data.publicUrl}
                            alt={`Banner de ${displayName(provider)}`}
                            className="w-full h-full object-contain"
                          />
                        </DialogContent>
                      </Dialog>
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
                    <h3 className="font-semibold text-lg mb-1">
                      {displayName(provider)}
                    </h3>
                    
                    {provider.categories && provider.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {provider.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {provider.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {provider.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">
                        {provider.rating || 0}
                      </span>
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

                    <div className="flex flex-wrap gap-2">
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
                        variant="default"
                        className="flex-1 bg-gradient-hero hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactClick(provider);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contactar
                      </Button>
                      {provider.website && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(provider.website!, "_blank");
                          }}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Providers;
