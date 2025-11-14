"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from './SessionContextProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    // Renderiza um loader enquanto a sessão está sendo verificada
    return (
      <div className="flex items-center justify-center h-screen bg-govbr-gray2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Verificando acesso...</p>
      </div>
    );
  }

  if (!session) {
    // Redireciona para a página de login se não houver sessão
    return <Navigate to="/login" replace />;
  }

  // Renderiza o conteúdo ou as rotas aninhadas
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;