import * as React from "react";
import { useSidebarStore } from "./use-sidebar-store";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  const setSidebarOpen = useSidebarStore((state) => state.setOpen);

  React.useEffect(() => {
    const onChange = () => {
      const isCurrentlyMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(isCurrentlyMobile);
      
      // Força o fechamento da sidebar em dispositivos móveis
      if (isCurrentlyMobile) {
        setSidebarOpen(false);
      } else {
        // Mantém aberta em desktop, a menos que o usuário tenha fechado manualmente
        // Não forçamos a abertura aqui para respeitar o estado manual, mas garantimos que o estado inicial seja true no store.
      }
    };
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", onChange);
    onChange(); // Executa na montagem
    
    return () => mql.removeEventListener("change", onChange);
  }, [setSidebarOpen]);

  return !!isMobile;
}