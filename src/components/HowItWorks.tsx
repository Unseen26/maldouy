import { Search, UserCheck, MessageSquare, Star } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Buscá el servicio",
    description: "Explorá categorías o buscá por palabras clave",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: UserCheck,
    title: "Elegí un proveedor",
    description: "Compará perfiles, calificaciones y precios",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "Contactá directamente",
    description: "Chateá, llamá o enviá WhatsApp",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Star,
    title: "Calificá el servicio",
    description: "Ayudá a otros con tu opinión",
    color: "from-yellow-500 to-orange-500",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 bg-gradient-card">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontrar el servicio que necesitás es muy simple
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection lines - hidden on mobile */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative text-center">
                <div className="inline-flex items-center justify-center mb-6">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
