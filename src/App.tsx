import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PublicForm from "./pages/PublicForm";
import FormBuilder from "./pages/FormBuilder";
import FormResponses from "./pages/FormResponses";
import Guide from "./pages/Guide";
import About from "./pages/About";
import Faq from "./pages/Faq";
import SelectMode from "./pages/SelectMode";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import AuthError from "./pages/AuthError";
import AdminDashboard from "./pages/AdminDashboard";
import ChatAdmin from "./pages/ChatAdmin";
import DataAnalysis from "./pages/DataAnalysis";
import NotFound from "./pages/NotFound";
import Changelog from "./pages/Changelog";
import JoinQuiz from "./pages/JoinQuiz";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pilih-mode" element={<SelectMode />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/chat-admin" element={<ChatAdmin />} />
              <Route path="/analisis" element={<DataAnalysis />} />
              <Route path="/form/:idOrSlug" element={<PublicForm />} />
              <Route path="/builder/:id" element={<FormBuilder />} />
              <Route path="/responses/:id" element={<FormResponses />} />
              <Route path="/panduan" element={<Guide />} />
              <Route path="/tentang" element={<About />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/kuis" element={<JoinQuiz />} />
              <Route path="/kuis/:code" element={<JoinQuiz />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
