import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const sb = supabase as any;

interface FavoriteProvider {
  id: string;
  provider_id: string;
  provider_profiles: {
    id: string;
    business_name: string | null;
    description: string | null;
    categories: string[] | null;
    service_area: string | null;
    rating: number | null;
    review_count: number | null;
    is_verified: boolean | null;
  };
}

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await sb
        .from("favorites")
        .select(`
          id,
          provider_id,
          provider_profiles (
            id,
            business_name,
            description,
            categories,
            service_area,
            rating,
            review_count,
            is_verified
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFavorites(data || []);
    } catch (error: any) {
      toast.error("Error al cargar favoritos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await sb.from("favorites").delete().eq("id", favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
      toast.success("Eliminado de favoritos");
    } catch (error: any) {
      toast.error("Error al eliminar favorito");
      console.error(error);
    }
  };

  const viewProvider = async (providerId: string) => {
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
      console.error("Error en viewProvider:", error);
      toast.error("Error al cargar publicación");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Favoritos</h1>
          <p className="text-muted-foreground">
            Proveedores que has guardado como favoritos
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando favoritos...</p>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tenés favoritos</h3>
            <p className="text-muted-foreground mb-4">
              Empezá a guardar proveedores que te interesen
            </p>
            <Button onClick={() => navigate("/providers?category=all")}>
              Explorar proveedores
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const provider = favorite.provider_profiles;
              return (
                <Card
                  key={favorite.id}
                  className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="text-6xl font-bold text-primary/20">
                      {(provider.business_name || "P").charAt(0).toUpperCase()}
                    </div>
                    {provider.is_verified && (
                      <div className="absolute top-3 right-3 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verificado
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-3 left-3"
                      onClick={() => removeFavorite(favorite.id)}
                    >
                      <Heart className="h-4 w-4 fill-current text-red-500" />
                    </Button>
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-1">
                      {provider.business_name || "Proveedor"}
                    </h3>

                    {provider.categories && provider.categories.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {provider.categories[0]}
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

                    <Button
                      className="w-full"
                      onClick={() => viewProvider(provider.id)}
                    >
                      Ver publicaciones
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
