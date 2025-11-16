import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchAverageWaitTime = async (): Promise<number | null> => {
  // Invoca a função de banco de dados
  const { data, error } = await supabase.rpc('calculate_average_wait_time');

  if (error) {
    console.error("Erro ao buscar média de tempo de espera:", error);
    throw new Error(error.message);
  }

  // O resultado é um número (média em dias) ou null se não houver dados
  return data as number | null;
};

export const useAverageWaitTime = () => {
  return useQuery<number | null, Error>({
    queryKey: ["averageWaitTime"],
    queryFn: fetchAverageWaitTime,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};