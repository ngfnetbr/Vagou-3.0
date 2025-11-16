import { useQuery } from "@tanstack/react-query";
import { fetchAllCompatibleTurmas, TurmaVagaDetalhe } from "@/integrations/supabase/turmas-vagas-api";

const ALL_COMPATIBLE_TURMAS_QUERY_KEY = 'allCompatibleTurmas';

export const useAllCompatibleTurmas = (criancaId: string, targetCmeiId?: string) => {
    return useQuery<TurmaVagaDetalhe[], Error>({
        queryKey: [ALL_COMPATIBLE_TURMAS_QUERY_KEY, criancaId, targetCmeiId],
        queryFn: () => fetchAllCompatibleTurmas(criancaId, targetCmeiId),
        enabled: !!criancaId,
    });
};