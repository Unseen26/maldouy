import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  Briefcase, 
  Utensils, 
  Sparkles, 
  Truck, 
  Heart, 
  GraduationCap, 
  MoreHorizontal 
} from "lucide-react";

const categories = [
  {
    icon: Home,
    title: "Hogar y Mantenimiento",
    description: "Limpieza, jardinería, electricidad, plomería",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Briefcase,
    title: "Servicios Profesionales",
    description: "Marketing, gestoría, diseño web, legal",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Utensils,
    title: "Catering y Eventos",
    description: "Catering, organización de eventos",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Sparkles,
    title: "Estética y Bienestar",
    description: "Belleza, peluquería, masajes, spa",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Truck,
    title: "Fletes y Mudanzas",
    description: "Fletes, mudanzas, traslados",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Heart,
    title: "Cuidado de Personas",
    description: "Niñeras, cuidado de mayores, mascotas",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: GraduationCap,
    title: "Educación",
    description: "Profesores particulares, cursos",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: MoreHorizontal,
    title: "Otros Servicios",
    description: "Servicios especializados",
    color: "from-gray-500 to-slate-500",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryTitle: string) => {
    navigate(`/providers?category=${encodeURIComponent(categoryTitle)}`);
  };

  return (
    <section id="servicios" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explorá nuestras categorías
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontrá el servicio que necesitás entre cientos de profesionales verificados
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={index}
                onClick={() => handleCategoryClick(category.title)}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-card-hover cursor-pointer"
              >
                <div className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-smooth">
                    {category.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
