import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import {
  Star,
  MapPin,
  CheckCircle,
  MessageCircle,
  Heart,
  Share2,
  Flag,
  Instagram,
  Facebook,
  Globe,
  Phone,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

const sb = supabase as any;

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

interface Provider {
  id: string;
  user_id: string;
  business_name: string | null;
  service_area: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  website: string | null;
  is_verified: boolean | null;
  banner_image: string | null;
}

const PublicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPublication();
      checkFavorite();
    }
  }, [id, user]);

  const fetchPublication = async () => {
    try {
      const { data: pubData, error: pubError } = await sb
        .from("service_publications")
        .select("*")
        .eq("id", id)
        .single();

      if (pubError) throw pubError;

      setPublication(pubData);

      const { data: provData, error: provError } = await sb
        .from("provider_profiles")
        .select("*")
        .eq("id", pubData.provider_id)
        .single();

      if (provError) throw provError;

      setProvider(provData);
    } catch (error: any) {
      toast.error("Error al cargar la publicación");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user || !id) return;

    try {
      const { data: pubData } = await sb
        .from("service_publications")
        .select("provider_id")
        .eq("id", id)
        .single();

      if (!pubData) return;

      const { data, error } = await sb
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider_id", pubData.provider_id)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para añadir favoritos");
      navigate("/auth");
      return;
    }

    if (!provider) return;

    try {
      if (isFavorite) {
        const { error } = await sb
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("provider_id", provider.id);

        if (error) throw error;

        setIsFavorite(false);
        toast.success("Eliminado de favoritos");
      } else {
        const { error } = await sb
          .from("favorites")
          .insert({
            user_id: user.id,
            provider_id: provider.id,
          });

        if (error) throw error;

        setIsFavorite(true);
        toast.success("Añadido a favoritos");
      }
    } catch (error: any) {
      toast.error("Error al gestionar favoritos");
      console.error(error);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para enviar mensajes");
      navigate("/auth");
      return;
    }

    if (!provider) return;

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

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: publication?.title || "Publicación",
          url: url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  const handleReport = () => {
    toast.info("Función de denuncia en desarrollo");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container px-4 py-6">
          <p className="text-center text-muted-foreground">Cargando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!publication || !provider) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container px-4 py-6">
          <p className="text-center text-muted-foreground">
            Publicación no encontrada
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
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFavorite}
              className={isFavorite ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="h-4 w-4 mr-2" />
                  Denunciar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{publication.title}</h1>
                  {publication.category && (
                    <Badge variant="secondary">{publication.category}</Badge>
                  )}
                </div>
                {provider.is_verified && (
                  <Badge className="bg-primary text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{publication.rating || 0}</span>
                  <span className="text-sm text-muted-foreground">
                    ({publication.review_count || 0} reseñas)
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
                <h2 className="text-xl font-semibold mb-3">Sobre mí</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {publication.description || "Sin descripción"}
                </p>
              </div>
            </Card>

            {publication.images && publication.images.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Imágenes</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {publication.images.map((img, idx) => (
                    <Dialog key={idx}>
                      <DialogTrigger asChild>
                        <div
                          className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                        >
                          <img
                            src={img}
                            alt={`${publication.title} - ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0">
                        <DialogTitle className="sr-only">Imagen de la publicación</DialogTitle>
                        <img
                          src={img}
                          alt={`${publication.title} - ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contacto y redes</h3>
              
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
                    onClick={() => {
                      const instagramHandle = provider.instagram!.startsWith("@")
                        ? provider.instagram!.substring(1)
                        : provider.instagram!;
                      window.open(`https://www.instagram.com/${instagramHandle}`, "_blank");
                    }}
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
                className="w-full bg-primary hover:bg-primary/90 mb-2"
                onClick={() => navigate(`/provider-public-profile/${provider.id}`)}
              >
                Ver perfil del proveedor
              </Button>
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

export default PublicationView;
