import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="bg-primary border-b border-primary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary-foreground p-2 rounded">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="text-primary-foreground">
              <h1 className="text-xl font-bold">VAGOU</h1>
              <p className="text-xs opacity-90">Sistema de Gestão de Vagas</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/publico/inscricao" className="text-primary-foreground hover:opacity-80 transition-opacity text-sm font-medium">
              Nova Inscrição
            </Link>
            <Link to="/login" className="bg-primary-foreground text-primary px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity">
              Área Administrativa
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};