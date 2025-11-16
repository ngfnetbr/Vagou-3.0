import { useQuery } from "@tanstack/react-query";
import { fetchAllTurmasWithVagas } from "@/integrations/supabase/turmas-api";

const ALL_AVAILABLE_TURMAS_QUERY_KEY = 'allAvailableTurmas';

export interface AvailableTurma {
    cmei: string;
    turma: string;
    vagas: number;
    cmei_id: string;
    turma_id: string;
}

export const useAllAvailableTurmas = () => {
    return useQuery<AvailableTurma[], Error>({
        queryKey: [ALL_AVAILABLE_TURMAS_QUERY_KEY],
        queryFn: fetchAllTurmasWithVagas,
    });
};