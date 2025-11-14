import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HistoricoEntry } from "@/integrations/supabase/criancas"; // Corrigido o caminho de importação

const HISTORICO_QUERY_KEY = ["historicoGeral"];

const fetchHistoricoGeral = async (): Promise<HistoricoEntry[]> => {
  const { data, error } = await supabase
    .from('historico')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  
  // Mapeia a estrutura do DB para HistoricoEntry
  return data.map(h => ({
    data: h.data,
    acao: h.acao,
    detalhes: h.detalhes,
    usuario: h.usuario,
  })) as HistoricoEntry[];
};

export function useHistoricoGeral() {
  const { data: logs, isLoading, error } = useQuery<HistoricoEntry[]>({
    queryKey: HISTORICO_QUERY_KEY,
    queryFn: fetchHistoricoGeral,
  });

  return {
    logs: logs || [],
    isLoading,
    error,
  };
}