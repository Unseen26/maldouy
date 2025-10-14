import { Button } from "./ui/button";
import { ArrowRight, Briefcase } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-hero text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* For Clients */}
            <div className="text-center md:text-left">
              <div className="inline-block p-3 bg-white/10 rounded-2xl mb-4">
                <ArrowRight className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                ¿Necesitás un servicio?
              </h2>
              <p className="text-white/90 mb-6">
                Encontrá profesionales verificados en segundos. Registrate gratis y empezá a buscar.
              </p>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary transition-smooth">
                Crear cuenta gratis
              </Button>
            </div>

            {/* For Providers */}
            <div className="text-center md:text-left border-l-0 md:border-l-2 border-white/20 md:pl-12">
              <div className="inline-block p-3 bg-white/10 rounded-2xl mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                ¿Sos proveedor de servicios?
              </h2>
              <p className="text-white/90 mb-6">
                Llegá a miles de clientes potenciales. Registrá tu negocio y empezá a crecer.
              </p>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary transition-smooth">
                Registrar mi negocio
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
