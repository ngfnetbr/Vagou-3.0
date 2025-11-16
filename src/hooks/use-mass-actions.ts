import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiMassRealocate, apiMassStatusUpdate, MassRealocationData, MassStatusUpdateData } from "@/integrations/supabase/criancas-api";
import { toast } from "sonner";

const CRIANCAS_QUERY_KEY = 'criancas';

export function useMassActions() {
    const queryClient = useQueryClient();

    const invalidateQueries = () => {
        queryClient.invalidateQueries({ queryKey: [CRIANCAS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: ['historicoGeral'] });
        // Não precisamos invalidar detalhes individuais, pois a lista principal será recarregada
    };

    // Mutação para Realocação em Massa
    const { mutateAsync: massRealocate, isPending: isMassRealocating } = useMutation({
        mutationFn: apiMassRealocate,
        onSuccess: (data, variables) => {
            invalidateQueries();
            toast.success("Realocação em massa concluída!", {
                description: `${variables.criancaIds.length} crianças movidas para ${variables.cmeiNome} - ${variables.turmaNome}.`,
            });
        },
        onError: (e: Error) => {
            toast.error("Falha na Realocação em Massa", { description: e.message });
        },
    });

    // Mutação para Mudança de Status em Massa
    const { mutateAsync: massStatusUpdate, isPending: isMassStatusUpdating } = useMutation({
        mutationFn: apiMassStatusUpdate,
        onSuccess: (data, variables) => {
            invalidateQueries();
            toast.success("Mudança de status em massa concluída!", {
                description: `${variables.criancaIds.length} crianças atualizadas para status: ${variables.status}.`,
            });
        },
        onError: (e: Error) => {
            toast.error("Falha na Mudança de Status em Massa", { description: e.message });
        },
    });

    return {
        massRealocate,
        isMassRealocating,
        massStatusUpdate,
        isMassStatusUpdating,
    };
}