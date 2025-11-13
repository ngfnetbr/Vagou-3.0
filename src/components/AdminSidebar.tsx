import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  School,
  ListOrdered,
  Bell,
  GraduationCap,
  FileText,
  Settings,
  Layers,
  History
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
  { icon: GraduationCap, label: "Matrículas", to: "/admin/matriculas" },
  { icon: ListOrdered, label: "Fila de Espera", to: "/admin/fila" },
  { icon: Users, label: "Crianças", to: "/admin/criancas" },
  { icon: School, label: "CMEIs", to: "/admin/cmeis" },
  { icon: Layers, label: "Turmas", to: "/admin/turmas" },
  { icon: Bell, label: "Convocações", to: "/admin/convocacoes" },
  { icon: FileText, label: "Relatórios", to: "/admin/relatorios" },
  { icon: Settings, label: "Configurações", to: "/admin/configuracoes" },
  { icon: History, label: "Logs do Sistema", to: "/logs" },
];

export const AdminSidebar = () => {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              activeClassName="bg-sidebar-primary font-medium"
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};