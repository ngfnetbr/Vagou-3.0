import { ReactNode, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Building2, LogOut, User, Menu, Accessibility } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSession } from "./SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { Dialog } from "@/components/ui/dialog";
import UnsavedChangesModal from "./UnsavedChangesModal";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import AccessibilityPanel from "./AccessibilityPanel";

interface AdminLayoutProps {
  children: ReactNode;
  shouldBlockNavigation?: boolean;
  onSaveAndNavigate?: (to: string) => Promise<void>; // Novo prop para salvar e navegar
  onDiscardAndNavigate?: (to: string) => void; // Novo prop para descartar e navegar
  isSaving?: boolean; // Novo prop para estado de salvamento
}

export const AdminLayout = ({ 
    children, 
    shouldBlockNavigation = false,
    onSaveAndNavigate,
    onDiscardAndNavigate,
    isSaving = false,
}: AdminLayoutProps) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const { isOpen, toggle } = useSidebarStore();
  const isMobile = useIsMobile();
  
  // Estado para o modal de navegação bloqueada
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  
  // Estado para o painel de acessibilidade
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  
  // Usa o hook de alerta de navegação
  const blockNavigation = useUnsavedChangesWarning(shouldBlockNavigation);
  
  const handleNavigationBlocked = (to: string) => {
      setTargetPath(to);
      setIsUnsavedModalOpen(true);
  };
  
  const handleSaveAndNavigate = async () => {
      if (targetPath && onSaveAndNavigate) {
          await onSaveAndNavigate(targetPath);
          setIsUnsavedModalOpen(false);
          setTargetPath(null);
          // A navegação é feita dentro do onSaveAndNavigate (na página Transicoes)
      }
  };
  
  const handleDiscardAndNavigate = () => {
      if (targetPath && onDiscardAndNavigate) {
          onDiscardAndNavigate(targetPath);
          setIsUnsavedModalOpen(false);
          setTargetPath(null);
      }
  };

  const handleLogout = async () => {
    // Se houver bloqueio, usa o alerta nativo para garantir que o usuário não perca dados
    if (shouldBlockNavigation) {
        const confirmLogout = window.confirm("Você tem alterações não salvas na Transição Anual. Deseja realmente sair e descartá-las?");
        if (!confirmLogout) {
            return;
        }
    }
    
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
      {/* Sidebar (Visível em desktop, oculta/fixa em mobile) */}
      <AdminSidebar 
        shouldBlockNavigation={shouldBlockNavigation} 
        blockNavigation={blockNavigation}
        onNavigationBlocked={handleNavigationBlocked} // Novo callback
      />
      
      {/* Overlay para mobile quando a sidebar está aberta */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={toggle}
        />
      )}
      
      <div 
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          !isMobile && (isOpen ? "ml-0" : "ml-0")
        )}
      >
        <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão de toggle para mobile */}
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggle}
                  className="text-primary"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              )}
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold text-foreground">VAGOU</h1>
                <p className="text-xs text-muted-foreground">Área Administrativa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Botão de Acessibilidade */}
                <Sheet open={isAccessibilityPanelOpen} onOpenChange={setIsAccessibilityPanelOpen}>
                    <SheetTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            aria-label="Configurações de Acessibilidade"
                            className="text-muted-foreground hover:text-primary"
                        >
                            <Accessibility className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <AccessibilityPanel />
                </Sheet>
                
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
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Modal de Alterações Não Salvas */}
      <Dialog open={isUnsavedModalOpen} onOpenChange={setIsUnsavedModalOpen}>
        <UnsavedChangesModal
            isOpen={isUnsavedModalOpen}
            onClose={() => setIsUnsavedModalOpen(false)}
            onSaveAndNavigate={handleSaveAndNavigate}
            onDiscardAndNavigate={handleDiscardAndNavigate}
            isSaving={isSaving}
        />
      </Dialog>
    </div>
  );
};