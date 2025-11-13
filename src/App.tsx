import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inscricao from "./pages/Inscricao";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import CMEIs from "./pages/admin/CMEIs";
import Matriculas from "./pages/admin/Matriculas";
import Fila from "./pages/admin/Fila";
import Criancas from "./pages/admin/Criancas";
import Turmas from "./pages/admin/Turmas";
import Convocacoes from "./pages/admin/Convocacoes";
import Relatorios from "./pages/admin/Relatorios";
import Configuracoes from "./pages/admin/Configuracoes";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Inscricao />} />
          <Route path="/inscricao" element={<Inscricao />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/cmeis" element={<CMEIs />} />
          <Route path="/admin/matriculas" element={<Matriculas />} />
          <Route path="/admin/fila" element={<Fila />} />
          <Route path="/admin/criancas" element={<Criancas />} />
          <Route path="/admin/turmas" element={<Turmas />} />
          <Route path="/admin/convocacoes" element={<Convocacoes />} />
          <Route path="/admin/relatorios" element={<Relatorios />} />
          <Route path="/admin/configuracoes" element={<Configuracoes />} />
          
          {/* Logs Route */}
          <Route path="/logs" element={<Logs />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;