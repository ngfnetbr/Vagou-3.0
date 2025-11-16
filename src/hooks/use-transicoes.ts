import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crianca } from "@/integrations/supabase/types";
import { fetchCriancas } from "@/integrations/supabase/criancas-api";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";

const TRANSICOES_QUERY_KEY = ["transicoes"];

// Simplificamos os status de transição para refletir o grupo de ação
export type StatusTransicao = 'Remanejamento Interno' | 'Fila Reclassificada' | 'Manter Status';

// Tipagem para o resultado da classificação
export interface CriancaClassificada extends Crianca {
    // Mantemos apenas o status de transição para agrupamento
    statusTransicao: StatusTransicao;
}

// Função de classificação no frontend
const classifyCriancasForTransition = (criancas: Crianca[]): CriancaClassificada[] => {
    
    const activeCriancas = criancas.filter(c => 
        c.status === 'Matriculado' || 
        c.status === 'Matriculada' || 
        c.status === 'Fila de Espera' ||
        c.status === 'Convocado'
    );

    return activeCriancas.map(crianca => {
        let statusTransicao: StatusTransicao = 'Manter Status';

        // Classifica pelo status atual para determinar o grupo de ação
        if (crianca.status === 'Matriculado' || crianca.status === 'Matriculada') {
            statusTransicao = 'Remanejamento Interno';
        } else if (crianca.status === 'Fila de Espera' || crianca.status === 'Convocado') {
            statusTransicao = 'Fila Reclassificada';
        }

        return {
            ...crianca,
            statusTransicao,
        } as CriancaClassificada;
    });
};

// --- Hook Principal ---

export function useTransicoes() {
    const queryClient = useQueryClient();
    
    // Estado para armazenar o planejamento (ajustes manuais)
    const [planningData, setPlanningData] = useState<CriancaClassificada[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Reutiliza a query de todas as crianças ativas
    const { data: criancas, isLoading, error } = useQuery<Crianca[], Error>({
        queryKey: ["criancas"], 
        queryFn: fetchCriancas,
    });

    // Classificação inicial baseada no ano alvo
    const initialClassification = useMemo(() => {
        if (!criancas) return [];
        return classifyCriancasForTransition(criancas);
    }, [criancas]);
    
    // Sincroniza a classificação inicial com o estado de planejamento
    useEffect(() => {
        // Se não houver dados de planejamento, reinicia o planejamento
        if (initialClassification.length > 0 && planningData.length === 0) {
            setPlanningData(initialClassification);
        }
    }, [initialClassification, planningData]);
    
    // Simulação de salvamento do planejamento (em um ambiente real, isso iria para o DB)
    const savePlanning = async () => {
        setIsSaving(true);
        try {
            // Simula o salvamento no DB
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success("Planejamento salvo com sucesso!", {
                description: `Ajustes foram armazenados.`,
            });
        } catch (e) {
            toast.error("Erro ao salvar planejamento.");
        } finally {
            setIsSaving(false);
        }
    };

    // Mock de mutação para executar a transição em massa (aplica o planejamento salvo)
    const executeTransition = async () => {
        if (planningData.length === 0) {
            toast.error("Nenhum planejamento para aplicar.");
            return;
        }
        
        // Simulação de API call para executar a transição no backend
        console.log(`Executando transição. Total de ${planningData.length} crianças.`);
        
        // Mock de sucesso
        return new Promise(resolve => setTimeout(resolve, 1500));
    };

    const transitionMutation = useMutation({
        mutationFn: executeTransition,
        onSuccess: () => {
            // Limpa o planejamento após a aplicação
            setPlanningData([]);
            queryClient.invalidateQueries({ queryKey: ["criancas"] });
            queryClient.invalidateQueries({ queryKey: TRANSICOES_QUERY_KEY });
            toast.success(`Transição executada com sucesso!`, {
                description: "Os status e classificações das crianças foram atualizados (Simulação).",
            });
        },
        onError: (e: Error) => {
            toast.error("Erro ao executar transição.", {
                description: e.message,
            });
        },
    });

    return {
        classificacao: planningData, // Retorna os dados de planejamento
        isLoading: isLoading,
        error,
        savePlanning,
        isSaving,
        executeTransition: transitionMutation.mutateAsync,
        isExecuting: transitionMutation.isPending,
    };
}