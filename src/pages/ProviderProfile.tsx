import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Loader2, ArrowLeft } from 'lucide-react';
import { providerProfileSchema } from '@/lib/validation';
const sb = supabase as any;

const categories = [
  "Hogar y Mantenimiento",
  "Servicios Profesionales",
  "Catering y Eventos",
  "Estética y Bienestar",
  "Fletes y Mudanzas",
  "Cuidado de Personas",
  "Educación",
  "Otros Servicios"
];

const ProviderProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    categories: [] as string[],
    service_area: '',
    website: '',
    whatsapp: '',
    facebook: '',
    instagram: ''
  });

  useEffect(() => {
    const checkProfile = async () => {
      if (!authLoading && user) {
        const { data: profile } = await sb
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if ((profile as any)?.role !== 'provider') {
          navigate('/');
          return;
        }

        const { data: providerProfile } = await sb
          .from('provider_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (providerProfile) {
          navigate('/');
        }
      }
      setChecking(false);
    };

    checkProfile();
  }, [user, authLoading, navigate]);

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const formatWhatsAppNumber = (number: string): string => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // If it already starts with 598, return as is
    if (cleaned.startsWith('598')) {
      return cleaned;
    }
    
    // If it starts with 0, remove it and add 598
    if (cleaned.startsWith('0')) {
      return '598' + cleaned.substring(1);
    }
    
    // Otherwise, just add 598 prefix
    return '598' + cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate form data
    const validation = providerProfileSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);

    try {
      const formattedWhatsApp = formatWhatsAppNumber(validation.data.whatsapp);

      const { error } = await sb
        .from('provider_profiles')
        .insert({
          user_id: user.id,
          business_name: validation.data.business_name,
          description: validation.data.description,
          categories: validation.data.categories,
          service_area: validation.data.service_area,
          website: validation.data.website || null,
          whatsapp: formattedWhatsApp,
          facebook: validation.data.facebook || null,
          instagram: validation.data.instagram || null
        });

      if (error) throw error;

      toast.success('¡Perfil de proveedor creado exitosamente!');
      navigate('/');
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error('Hubo un problema. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Completá tu perfil de proveedor
          </h1>
          <p className="text-muted-foreground">
            Para comenzar a ofrecer tus servicios, completá la siguiente información
          </p>
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business_name">
                Nombre del negocio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Ej: Plomería Rodríguez"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción de tus servicios <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describí qué servicios ofrecés, tu experiencia, etc."
                rows={4}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>
                Categorías <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={formData.categories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label
                      htmlFor={category}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_area">
                Zona de servicio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service_area"
                value={formData.service_area}
                onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                placeholder="Ej: Montevideo y Ciudad de la Costa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">
                WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="Ej: 099977505"
                required
              />
              <p className="text-sm text-muted-foreground">
                Se agregará automáticamente el prefijo +598 de Uruguay
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Redes sociales (opcional)</h3>
              
              <div className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="website">Sitio web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://tusitio.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="https://facebook.com/tunegocio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@tunegocio"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear perfil de proveedor'
              )}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default ProviderProfile;
