import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Loader2, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { publicationSchema } from "@/lib/validation";

const sb = supabase as any;

const categories = [
  "Hogar y Mantenimiento",
  "Servicios Profesionales",
  "Catering y Eventos",
  "Estética y Bienestar",
  "Fletes y Mudanzas",
  "Cuidado de Personas",
  "Educación",
  "Otros Servicios",
];

const PublicationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      const { data: profile } = await sb
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) return;

      const { data: providerProfile } = await sb
        .from("provider_profiles")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!providerProfile) {
        toast.error("Necesitás un perfil de proveedor");
        navigate("/");
        return;
      }

      setProviderId(providerProfile.id);

      if (isEditing) {
        const { data: publication } = await sb
          .from("service_publications")
          .select("*")
          .eq("id", id)
          .eq("provider_id", providerProfile.id)
          .maybeSingle();

        if (publication) {
          setFormData({
            title: publication.title,
            description: publication.description || "",
            category: publication.category || "",
          });
          setImages(publication.images || []);
        }
      }
    };

    fetchData();
  }, [user, id, isEditing]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await sb.storage
          .from("service-images")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = sb.storage.from("service-images").getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedUrls]);
      toast.success("Imágenes subidas exitosamente");
    } catch (error: any) {
      console.error("Error al subir imagen:", error);
      toast.error(error?.message || "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    if (!user || !id) {
      toast.error("Error al eliminar imagen: faltan datos de usuario o publicación.");
      return;
    }

    const imageToRemoveUrl = images[index];
    if (!imageToRemoveUrl) return;

    // Extract filePath from publicUrl
    // Assuming the publicUrl format is consistent: .../service-images/{user.id}/{fileName}
    const urlParts = imageToRemoveUrl.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const filePathInStorage = `${user.id}/${fileNameWithExtension}`;

    const newImages = images.filter((_, i) => i !== index);

    setLoading(true); // Indicate loading while deleting

    try {
      // 1. Delete from Supabase Storage
      const { error: storageError } = await sb.storage
        .from("service-images")
        .remove([filePathInStorage]);

      if (storageError) {
        console.error("Error deleting image from storage:", storageError);
        // Depending on the error, you might want to still proceed with DB update
        // or re-throw. For now, let's re-throw to indicate a failure.
        throw storageError;
      }

      // 2. Update the publication in the database
      const { error: updateError } = await sb
        .from("service_publications")
        .update({ images: newImages })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating publication images in DB:", updateError);
        throw updateError;
      }

      setImages(newImages); // Update local state only after successful DB update
      toast.success("Imagen eliminada exitosamente");
    } catch (error: any) {
      console.error("Error al eliminar imagen:", error);
      toast.error(error?.message || "Error al eliminar imagen");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerId) {
      toast.error("Error de configuración");
      return;
    }

    // Validate form data
    const validation = publicationSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);

    try {
      const publicationData = {
        provider_id: providerId,
        title: validation.data.title,
        description: validation.data.description,
        category: validation.data.category,
        images: images,
      };

      if (isEditing) {
        const { error } = await sb
          .from("service_publications")
          .update(publicationData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Publicación actualizada");
      } else {
        const { error } = await sb
          .from("service_publications")
          .insert(publicationData);

        if (error) throw error;
        toast.success("Publicación creada exitosamente");
      }

      navigate("/my-publications");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Hubo un problema. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {isEditing ? "Editar Publicación" : "Nueva Publicación"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Actualizá la información de tu servicio"
              : "Creá una publicación para mostrar tus servicios"}
          </p>
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título del servicio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Instalación de aires acondicionados"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describí en detalle el servicio que ofrecés..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Imágenes</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {uploading
                      ? "Subiendo imágenes..."
                      : "Hacé clic para subir imágenes"}
                  </span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/my-publications")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-hero hover:opacity-90"
                disabled={loading || uploading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : isEditing ? (
                  "Actualizar"
                ) : (
                  "Publicar"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default PublicationForm;
