import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProviderProfile from "./pages/ProviderProfile";
import EditProviderProfile from "./pages/EditProviderProfile";
import Providers from "./pages/Providers";
import ProviderReview from "./pages/ProviderReview";
import MyPublications from "./pages/MyPublications";
import PublicationForm from "./pages/PublicationForm";
import PublicationView from "./pages/PublicationView";
import Messages from "./pages/Messages";
import Favorites from "./pages/Favorites";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import ProviderPublicProfile from "./pages/ProviderPublicProfile";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/provider-profile" element={<ProviderProfile />} />
              <Route path="/edit-provider-profile" element={<EditProviderProfile />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/provider/:id/review" element={<ProviderReview />} />
              <Route path="/my-publications" element={<MyPublications />} />
              <Route path="/publications/new" element={<PublicationForm />} />
              <Route path="/publications/edit/:id" element={<PublicationForm />} />
              <Route path="/publication/:id" element={<PublicationView />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/provider-public-profile/:id" element={<ProviderPublicProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
