import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Briefcase } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState("");
  const [whatsappVerificationStep, setWhatsappVerificationStep] = useState("inputPhone"); // "inputPhone" or "inputCode"
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const handleSendWhatsAppCode = async () => {
    setIsLoading(true);
    setWhatsappError(null);
    try {
      const response = await fetch("http://localhost:3001/api/iniciar-verificacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: whatsappPhoneNumber }),
      });
      const data = await response.json();
      if (data.success) {
        setWhatsappVerificationStep("inputCode");
      } else {
        setWhatsappError(data.message || "Error al enviar el código de verificación.");
      }
    } catch (error) {
      console.error("Error sending WhatsApp code:", error);
      setWhatsappError("Error de red o del servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyWhatsAppCode = async (code: string) => {
    setIsLoading(true);
    setWhatsappError(null);
    try {
      const response = await fetch("http://localhost:3001/api/comprobar-verificacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: whatsappPhoneNumber, code }),
      });
      const data = await response.json();
      if (data.success && data.approved) {
        // WhatsApp verification successful, now try to sign up/sign in via Supabase
        const email = `${whatsappPhoneNumber}@maldouy.com`; // Using a dummy domain for email
        const password = uuidv4(); // Generate a unique password

        // Try to sign up the user
        const { error: signUpError } = await signUp(email, password, "WhatsApp User", "client");

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            // User already exists, try to sign in
            const { error: signInError } = await signIn(email, password);
            if (signInError) {
              setWhatsappError(signInError.message || "Error al iniciar sesión con WhatsApp.");
            } else {
              alert("Inicio de sesión con WhatsApp exitoso!");
              navigate("/");
            }
          } else {
            setWhatsappError(signUpError.message || "Error al registrarse con WhatsApp.");
          }
        } else {
          alert("Registro con WhatsApp exitoso!");
          navigate("/");
        }
      } else {
        setWhatsappError(data.message || "Código de verificación incorrecto.");
      }
    } catch (error) {
      console.error("Error verifying WhatsApp code:", error);
      setWhatsappError("Error de red o del servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión / Registrarse con WhatsApp
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          <h3 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
            Verificación por WhatsApp
          </h3>
          {whatsappVerificationStep === "inputPhone" ? (
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="Número de WhatsApp (ej: +1234567890)"
                value={whatsappPhoneNumber}
                onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendWhatsAppCode}
                className="w-full bg-gradient-hero hover:opacity-90 transition-smooth"
                disabled={isLoading || !whatsappPhoneNumber}
              >
                {isLoading ? "Enviando..." : "Enviar código por WhatsApp"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Código de verificación"
                onChange={(e) => {
                  if (e.target.value.length === 6) {
                    handleVerifyWhatsAppCode(e.target.value);
                  }
                }}
                disabled={isLoading}
                maxLength={6}
              />
              <Button
                onClick={() => setWhatsappVerificationStep("inputPhone")}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Reenviar código o cambiar número
              </Button>
            </div>
          )}
          {whatsappError && (
            <p className="mt-2 text-center text-sm text-red-600">
              {whatsappError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
