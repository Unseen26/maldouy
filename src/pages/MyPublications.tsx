import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit, Trash2, Star, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const sb = supabase as any;

interface Publication {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  images: string[] | null;
  is_active: boolean | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
}

const MyPublications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPublications();
  }, [user]);

  const fetchPublications = async () => {
    try {
      const { data: profile } = await sb
        .from("profiles")
        .select("id")
        .eq("id", user?.id)
        .maybeSingle();

      if (!profile) return;

      const { data: providerProfile } = await sb
        .from("provider_profiles")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!providerProfile) return;

      const { data, error } = await sb
        .from("service_publications")
        .select("*")
        .eq("provider_id", providerProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPublications(data || []);
    } catch (error: any) {
      toast.error("Error al cargar las publicaciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean | null) => {
    try {
      const { error } = await sb
        .from("service_publications")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      toast.success(
        !currentState ? "Publicación activada" : "Publicación desactivada"
      );
      fetchPublications();
    } catch (error: any) {
      toast.error("Error al actualizar la publicación");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await sb
        .from("service_publications")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Publicación eliminada");
      setDeleteId(null);
      fetchPublications();
    } catch (error: any) {
      toast.error("Error al eliminar la publicación");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Mis Publicaciones
            </h1>
            <p className="text-muted-foreground">
              Administrá tus servicios publicados
            </p>
          </div>
          <Button
            onClick={() => navigate("/publications/new")}
            className="bg-gradient-hero hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Publicación
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando publicaciones...</p>
          </div>
        ) : publications.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              Aún no tenés publicaciones
            </p>
            <Button
              onClick={() => navigate("/publications/new")}
              className="bg-gradient-hero hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear primera publicación
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((pub) => (
              <Card key={pub.id} className="overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                  {pub.images && pub.images.length > 0 ? (
                    <img
                      src={pub.images[0]}
                      alt={pub.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-primary/20">
                      {pub.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!pub.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-destructive text-white px-3 py-1 rounded-full text-sm font-medium">
                        Inactiva
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{pub.title}</h3>

                  {pub.category && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mb-3 inline-block">
                      {pub.category}
                    </span>
                  )}

                  {pub.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {pub.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mb-4">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">
                      {pub.rating || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({pub.review_count || 0} reseñas)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/publications/edit/${pub.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(pub.id, pub.is_active)}
                    >
                      {pub.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteId(pub.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La publicación y todas sus
              reseñas serán eliminadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default MyPublications;
