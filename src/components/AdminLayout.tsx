import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Building2, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "./SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user } = useSession();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair", { description: error.message });
    } else {
      toast.success("Sessão encerrada com sucesso!");
      navigate('/login');
    }
  };
  
  // Tenta obter o nome do perfil (se existir) ou usa o email
  const userName = user?.email || 'Usuário';
  
  return (
    <div className="flex h-screen bg-govbr-gray2">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold text-foreground">VAGOU</h1>
                <p className="text-xs text-muted-foreground">Área Administrativa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{userName}</span>
                </div>
                <Button 
                    variant="ghost" 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};