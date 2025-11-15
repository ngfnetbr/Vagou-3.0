import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  School,
  ListOrdered,
  GraduationCap,
  FileText,
  Settings,
  Layers,
  History,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
  { icon: GraduationCap, label: "Matrículas", to: "/admin/matriculas" },
  { icon: ListOrdered, label: "Fila de Espera", to: "/admin/fila" },
  { icon: Users, label: "Crianças", to: "/admin/criancas" },
  { icon: School, label: "CMEIs", to: "/admin/cmeis" },
  { icon: Layers, label: "Turmas", to: "/admin/turmas" },
  { icon: FileText, label: "Relatórios", to: "/admin/relatorios" },
  { icon: Settings, label: "Configurações", to: "/admin/configuracoes" },
  { icon: History, label: "Logs do Sistema", to: "/admin/logs" },
];

export const AdminSidebar = () => {
  const { isOpen, toggle } = useSidebarStore();
  
  const ToggleIcon = isOpen ? ChevronLeft : ChevronRight;

  return (
    <aside 
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex-shrink-0 transition-all duration-300 ease-in-out",
        "fixed md:static h-full z-30", // Adiciona fixed/static para responsividade
        isOpen ? "w-64" : "w-16",
        // Esconde completamente em mobile se estiver fechada
        !isOpen && "hidden md:block" 
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header/Logo Area */}
        <div className={cn("p-4 flex items-center justify-between h-16", isOpen ? "justify-between" : "justify-center")}>
          {isOpen && (
            <div className="text-sidebar-foreground">
              <h1 className="text-xl font-bold">VAGOU</h1>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <ToggleIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isOpen ? "Recolher Menu" : "Expandir Menu"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Menu Items */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 py-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                      isOpen ? "px-4" : "justify-center px-0",
                      "w-full"
                    )}
                    activeClassName="bg-sidebar-primary font-medium"
                  >
                    <Icon className={cn("h-5 w-5", !isOpen && "mx-auto")} />
                    <span className={cn("text-sm whitespace-nowrap transition-opacity duration-200", !isOpen && "opacity-0 hidden")}>
                      {item.label}
                    </span>
                  </NavLink>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};