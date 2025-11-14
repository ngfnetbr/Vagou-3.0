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
// import Convocacoes from "./pages/admin/Convocacoes"; // Removido
import Relatorios from "./pages/admin/Relatorios";
import Configuracoes from "./pages/admin/Configuracoes";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import DetalhesTurma from "./pages/admin/DetalhesTurma";
import DetalhesCrianca from "./pages/admin/DetalhesCrianca"; // Importando a nova página
import { SessionContextProvider } from "./components/SessionContextProvider";
import ProtectedRoute from "./components/ProtectedRoute"; // Importando o ProtectedRoute

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Inscricao />} />
            <Route path="/inscricao" element={<Inscricao />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes (Protected) */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<Dashboard />} />
              <Route path="cmeis" element={<CMEIs />} />
              <Route path="matriculas" element={<Matriculas />} />
              <Route path="fila" element={<Fila />} />
              <Route path="criancas" element={<Criancas />} />
              <Route path="criancas/:id" element={<DetalhesCrianca />} />
              <Route path="turmas" element={<Turmas />} />
              <Route path="turmas/:id" element={<DetalhesTurma />} />
              {/* <Route path="convocacoes" element={<Convocacoes />} /> */}
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="/admin/logs" element={<Logs />} /> {/* Logs dentro da área admin */}
            </Route>
            
            {/* Logs Route (Movido para dentro de /admin, mas mantendo a rota antiga por enquanto se necessário) */}
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;