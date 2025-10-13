import { Button } from "./ui/button";
import { Menu, User, LogIn, LogOut, Settings, FileText, MessageCircle, Heart, HelpCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isProvider, setIsProvider] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sb = supabase as any;

  useEffect(() => {
    const checkIfProvider = async () => {
      if (!user) {
        setIsProvider(false);
        return;
      }

      const { data: profile } = await sb
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      setIsProvider((profile as any)?.role === 'provider');
    };

    checkIfProvider();
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Maldo
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-foreground hover:text-primary transition-smooth font-medium">
              Servicios
            </a>
            <a href="#como-funciona" className="text-foreground hover:text-primary transition-smooth font-medium">
              Cómo funciona
            </a>
            <a href="#proveedores" className="text-foreground hover:text-primary transition-smooth font-medium">
              Proveedores destacados
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Mobile: Hamburger menu */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="text-left">Menú</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-6">
                      {isProvider && (
                        <>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                              navigate('/edit-provider-profile');
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Editar perfil
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                              navigate('/my-publications');
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Mis publicaciones
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate('/messages');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Mensajes
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate('/favorites');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Favoritos
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate('/faq');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Preguntas Frecuentes
                      </Button>
                      <hr className="my-2" />
                      <Button
                        variant="ghost"
                        className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          await signOut();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate('/auth')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Button>
                <Button size="sm" className="bg-gradient-hero hover:opacity-90" onClick={() => navigate('/auth')}>
                  <User className="mr-2 h-4 w-4" />
                  Registrarse
                </Button>

                {/* Mobile menu for non-authenticated users */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="text-left">Menú</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-6">
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate('/my-account');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Mi cuenta
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate('/auth');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Iniciar sesión
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate('/auth');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Registrarse
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;