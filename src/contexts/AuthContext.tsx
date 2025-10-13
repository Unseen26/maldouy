import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
const sb = supabase as any;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'client' | 'provider') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN') {
        setTimeout(async () => {
          if (!mounted) return;
          if (session?.user) {
            const { data: profile } = await sb
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!mounted) return;
            if ((profile as any)?.role === 'provider') {
              const { data: providerProfile } = await sb
                .from('provider_profiles')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (!mounted) return;
              if (!providerProfile) {
                navigate('/provider-profile');
                return;
              }
            }
          }
          // navigate('/'); // Removed to prevent unwanted redirection to home page after sign-in
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, fullName: string, role: 'client' | 'provider') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email ya está registrado. Por favor, inicia sesión.');
        } else {
          toast.error(error.message);
        }
        return { error };
      }
      
      toast.success('¡Cuenta creada exitosamente! Puedes iniciar sesión ahora.');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al crear la cuenta');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email o contraseña incorrectos');
        } else {
          toast.error(error.message);
        }
        return { error };
      }
      
      toast.success('¡Bienvenido de vuelta!');
      navigate('/'); // Add this line to navigate to the home page after successful login
      return { error: null };
    } catch (error: any) {
      toast.error('Error al iniciar sesión');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/');
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
