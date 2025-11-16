import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para alertar o usuário sobre alterações não salvas ao tentar navegar ou fechar a aba.
 * @param hasUnsavedChanges Booleano que indica se há alterações pendentes.
 * @param message Mensagem de alerta.
 * @returns Uma função que retorna o destino (string) se a navegação for bloqueada, ou null se for permitida.
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean, message: string = "Você tem alterações não salvas. Deseja realmente sair?") {
  const location = useLocation();

  // 1. Alerta ao tentar fechar a aba/navegador (beforeunload)
  useEffect(() => {
    if (hasUnsavedChanges) {
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = message;
        return message;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasUnsavedChanges, message]);

  // 2. Função para bloquear a navegação interna (usada no AdminSidebar)
  const blockNavigation = useCallback((to: string): string | null => {
    if (hasUnsavedChanges && to !== location.pathname) {
        // Retorna o destino para que o componente pai possa abrir o modal
        return to; 
    }
    return null; // Permite a navegação
  }, [hasUnsavedChanges, location.pathname]);

  return blockNavigation;
}