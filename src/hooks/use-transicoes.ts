import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crianca } from "@/integrations/supabase/types";
import { fetchCriancas, apiMarcarDesistente, apiTransferirCrianca, apiMassRealocate, apiMarcarFimDeFila, apiConvocarCrianca } from "@/integrations/supabase/criancas-api";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import { ConvocationData } from "@/integrations/supabase/types";
import { format } from "date-fns";

const TRANSICOES_QUERY_KEY = ["transicoes"];
const PLANNING_STORAGE_KEY = "vagou_transition_planning"; // Chave para localStorage

export type StatusTransicao = 'Remanejamento Interno' | 'Fila Reclassificada' | 'Manter Status' | 'Saída Final';

// Tipagem para o resultado da classificação, incluindo campos de planejamento
export interface CriancaClassificada extends Crianca {
    statusTransicao: StatusTransicao;
    
    // Campos de planejamento (null se não houver mudança planejada)
    planned_status?: Crianca['status'] | null;
    planned_cmei_id?: string | null;
    planned_turma_id?: string | null;
    planned_cmei_nome?: string | null;
    planned_turma_nome?: string | null;
    planned_justificativa?: string | null;
}

// Função de classificação no frontend
const classifyCriancasForTransition = (criancas: Crianca[]): CriancaClassificada[] => {
    
    // Inclui todos os status relevantes: ativos + status finais que representam saídas
    const relevantCriancas = criancas.filter(c => 
        c.status === 'Matriculado' || 
        c.status === 'Matriculada' || 
        c.status === 'Fila de Espera' ||
        c.status === 'Convocado' ||
        c.status === 'Desistente' || // Incluído
        c.status === 'Recusada' // Incluído
    );

    return relevantCriancas.map(crianca => {
        let statusTransicao: StatusTransicao = 'Manter Status';

        if (crianca.status === 'Matriculado' || crianca.status === 'Matriculada') {
            statusTransicao = 'Remanejamento Interno';
        } else if (crianca.status === 'Fila de Espera' || crianca.status === 'Convocado') {
            statusTransicao = 'Fila Reclassificada';
        } else if (crianca.status === 'Desistente' || crianca.status === 'Recusada') {
            statusTransicao = 'Saída Final'; // Novo status de transição
        }

        return {
            ...crianca,
            statusTransicao,
            // Inicializa o planejamento como UNDEFINED
            planned_status: undefined,
            planned_cmei_id: undefined,
            planned_turma_id: undefined,
            planned_cmei_nome: undefined,
            planned_turma_nome: undefined,
            planned_justificativa: undefined,
        } as CriancaClassificada;
    });
};

// Função utilitária para comparação profunda (shallow comparison dos campos de planejamento)
const arePlanningStatesEqual = (state1: CriancaClassificada[], state2: CriancaClassificada[]): boolean => {
    if (state1.length !== state2.length) return false;
    
    // Cria um mapa de planejamento para comparação rápida
    const map1 = new Map(state1.map(c => [c.id, {
        planned_status: c.planned_status,
        planned_cmei_id: c.planned_cmei_id,
        planned_turma_id: c.planned_turma_id,
        planned_justificativa: c.planned_justificativa,
    }]));
    
    for (const c2 of state2) {
        const p1 = map1.get(c2.id);
        if (!p1) return false;
        
        // Compara os campos de planejamento
        if (p1.planned_status !== c2.planned_status ||
            p1.planned_cmei_id !== c2.planned_cmei_id ||
            p1.planned_turma_id !== c2.planned_turma_id ||
            p1.planned_justificativa !== c2.planned_justificativa) {
            return false;
        }
    }
    
    return true;
};


// --- Hook Principal ---

export function useTransicoes() {
    const queryClient = useQueryClient();
    
    const [planningData, setPlanningData] = useState<CriancaClassificada[]>([]);
    const [lastSavedPlanning, setLastSavedPlanning] = useState<CriancaClassificada[]>([]); // Novo estado para o último estado salvo
    const [isSaving, setIsSaving] = useState(false);

    const { data: criancas, isLoading, error } = useQuery<Crianca[], Error>({
        queryKey: ["criancas"], 
        queryFn: fetchCriancas,
    });

    const initialClassification = useMemo(() => {
        if (!criancas) return [];
        return classifyCriancasForTransition(criancas);
    }, [criancas]);
    
    // Efeito para carregar o planejamento do localStorage na montagem
    useEffect(() => {
        const savedPlanning = localStorage.getItem(PLANNING_STORAGE_KEY);
        
        if (savedPlanning) {
            try {
                const parsedPlanning = JSON.parse(savedPlanning) as CriancaClassificada[];
                
                // Verifica se o planejamento salvo corresponde à lista atual de IDs de crianças
                const savedIds = new Set(parsedPlanning.map(c => c.id));
                const currentIds = new Set(initialClassification.map(c => c.id));
                
                // Se os IDs forem idênticos, carrega o planejamento salvo
                if (savedIds.size > 0 && savedIds.size === currentIds.size && [...savedIds].every(id => currentIds.has(id))) {
                    setPlanningData(parsedPlanning);
                    setLastSavedPlanning(parsedPlanning); // Define como o último estado salvo
                    toast.info("Planejamento anterior carregado.", { duration: 3000 });
                    return;
                }
            } catch (e) {
                console.error("Erro ao carregar planejamento do localStorage:", e);
                localStorage.removeItem(PLANNING_STORAGE_KEY);
            }
        }
        
        // Se não houver planejamento salvo ou se os dados estiverem desatualizados, usa a classificação inicial
        if (initialClassification.length > 0 && planningData.length === 0) {
            setPlanningData(initialClassification);
            setLastSavedPlanning(initialClassification); // Define a classificação inicial como o último estado salvo
        }
        
    }, [initialClassification]); // Depende apenas da classificação inicial

    // --- Lógica de Alterações Não Salvas (Calculado) ---
    const hasUnsavedChanges = useMemo(() => {
        if (isLoading || planningData.length === 0) return false;
        
        // Compara o estado atual com o último estado salvo
        return !arePlanningStatesEqual(planningData, lastSavedPlanning);
    }, [planningData, lastSavedPlanning, isLoading]);


    // --- Funções de Manipulação do Planejamento ---

    const updateCriancaInPlanning = (criancaId: string, updates: Partial<CriancaClassificada>) => {
        setPlanningData(prev => prev.map(c => 
            c.id === criancaId ? { ...c, ...updates } : c
        ));
    };

    const updateCriancaStatusInPlanning = (criancaId: string, newStatus: Crianca['status'], justificativa: string) => {
        updateCriancaInPlanning(criancaId, {
            planned_status: newStatus,
            planned_justificativa: justificativa,
            // Limpa vaga se o status for final
            planned_cmei_id: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : undefined,
            planned_turma_id: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : undefined,
            planned_cmei_nome: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : undefined,
            planned_turma_nome: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : undefined,
        });
    };

    const updateCriancaVagaInPlanning = (criancaId: string, cmei_id: string, turma_id: string, cmei_nome: string, turma_nome: string) => {
        setPlanningData(prev => prev.map(c => {
            if (c.id === criancaId) {
                
                let newPlannedStatus: Crianca['status'];
                
                // Statuses que indicam que a criança não está ativamente matriculada e precisa ser CONVOCADA
                const needsConvocation = ['Fila de Espera', 'Convocado', 'Desistente', 'Recusada', 'Saída Final'].includes(c.status);
                
                if (needsConvocation) {
                    newPlannedStatus = 'Convocado';
                } 
                // Se a criança já está matriculada, a realocação é uma MUDANÇA DE TURMA (mantém o status de matrícula).
                else if (c.status === 'Matriculado' || c.status === 'Matriculada') {
                    newPlannedStatus = c.status;
                } else {
                    // Fallback seguro
                    newPlannedStatus = 'Matriculado';
                }
                    
                return {
                    ...c,
                    planned_cmei_id: cmei_id,
                    planned_turma_id: turma_id,
                    planned_cmei_nome: cmei_nome,
                    planned_turma_nome: turma_nome,
                    planned_status: newPlannedStatus, 
                    planned_justificativa: null,
                };
            }
            return c;
        }));
    };
    
    const massUpdateStatusInPlanning = (criancaIds: string[], newStatus: Crianca['status'], justificativa: string) => {
        setPlanningData(prev => prev.map(c => {
            if (criancaIds.includes(c.id)) {
                return {
                    ...c,
                    planned_status: newStatus,
                    planned_justificativa: justificativa,
                    planned_cmei_id: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : c.planned_cmei_id,
                    planned_turma_id: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : c.planned_turma_id,
                    planned_cmei_nome: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : c.planned_cmei_nome,
                    planned_turma_nome: ['Desistente', 'Recusada', 'Fila de Espera'].includes(newStatus) ? null : c.planned_turma_nome,
                };
            }
            return c;
        }));
    };
    
    const massUpdateVagaInPlanning = (criancaIds: string[], cmei_id: string, turma_id: string, cmei_nome: string, turma_nome: string) => {
        setPlanningData(prev => prev.map(c => {
            if (criancaIds.includes(c.id)) {
                
                let newPlannedStatus: Crianca['status'];
                
                // Statuses que indicam que a criança não está ativamente matriculada e precisa ser CONVOCADA
                const needsConvocation = ['Fila de Espera', 'Convocado', 'Desistente', 'Recusada', 'Saída Final'].includes(c.status);
                
                if (needsConvocation) {
                    newPlannedStatus = 'Convocado';
                } 
                // Se a criança já está matriculada, a realocação é uma MUDANÇA DE TURMA (mantém o status de matrícula).
                else if (c.status === 'Matriculado' || c.status === 'Matriculada') {
                    newPlannedStatus = c.status;
                } else {
                    // Fallback seguro
                    newPlannedStatus = 'Matriculado';
                }
                    
                return {
                    ...c,
                    planned_cmei_id: cmei_id,
                    planned_turma_id: turma_id,
                    planned_cmei_nome: cmei_nome,
                    planned_turma_nome: turma_nome,
                    planned_status: newPlannedStatus,
                    planned_justificativa: null,
                };
            }
            return c;
        }));
    };

    // Função para salvar o planejamento no localStorage
    const savePlanning = async () => {
        setIsSaving(true);
        try {
            localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(planningData));
            setLastSavedPlanning(planningData); // ATUALIZA O ESTADO SALVO
            await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay de salvamento
            toast.success("Planejamento salvo com sucesso!", {
                description: `Ajustes foram armazenados localmente no navegador.`,
            });
        } catch (e) {
            toast.error("Erro ao salvar planejamento.", {
                description: "Não foi possível acessar o armazenamento local.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Execução da Transição (Aplica as mudanças planejadas ao DB) ---
    const executeTransition = async () => {
        if (planningData.length === 0) {
            throw new Error("Nenhum dado de planejamento para aplicar.");
        }
        
        // 1. Validação: Verificar se todas as crianças ativas têm um planejamento definido
        const unplannedCriancas = planningData.filter(c => 
            // Crianças que estavam matriculadas/convocadas (Remanejamento Interno) DEVEM ter um planned_status definido.
            c.statusTransicao === 'Remanejamento Interno' && 
            (c.planned_status === undefined || c.planned_status === null)
        );
        
        if (unplannedCriancas.length > 0) {
            const unplannedNames = unplannedCriancas.slice(0, 3).map(c => c.nome).join(', ');
            toast.error("Planejamento Incompleto", {
                description: `Existem ${unplannedCriancas.length} crianças matriculadas sem status planejado (ex: ${unplannedNames}). Defina a ação (Realocar ou Conclusão de Ciclo).`,
                duration: 8000,
            });
            throw new Error("Planejamento incompleto.");
        }
        
        // 2. Filtrar mudanças reais
        const changesToApply = planningData.filter(c => {
            // Se o status é Saída Final e não há planejamento, não há mudança a ser aplicada.
            if (c.statusTransicao === 'Saída Final' && c.planned_status === undefined) {
                return false;
            }
            
            // Consideramos mudança se o planned_status for definido E for diferente do status atual
            const statusChanged = c.planned_status !== undefined && c.planned_status !== c.status;
            
            // OU se a vaga planejada for diferente da vaga atual (e o status não for de saída)
            const vagaChanged = c.planned_status !== 'Desistente' && c.planned_status !== 'Recusada' && (
                c.planned_cmei_id !== c.cmei_atual_id || 
                c.planned_turma_id !== c.turma_atual_id
            );
            
            return statusChanged || vagaChanged;
        });
        
        if (changesToApply.length === 0) {
            toast.info("Nenhuma alteração detectada no planejamento.");
            return;
        }
        
        const promises: Promise<any>[] = [];
        
        // Agrupamento para Realocação em Massa (otimização)
        const realocacoes: { [key: string]: string[] } = {}; // key: cmei_id|turma_id|cmei_nome|turma_nome, value: criancaIds
        
        for (const crianca of changesToApply) {
            const { id, planned_status, planned_cmei_id, planned_turma_id, planned_justificativa, planned_cmei_nome, planned_turma_nome } = crianca;
            
            // O status a ser aplicado é o planejado, ou o atual se for apenas realocação de vaga
            const finalStatus = planned_status || crianca.status;
            
            // 1. Mudança de Status (Desistente/Concluinte/Fila/Convocado)
            if (planned_status !== crianca.status) {
                const justificativa = planned_justificativa || 'Ação de Transição Anual';
                
                if (planned_status === 'Desistente') {
                    promises.push(apiMarcarDesistente(id, justificativa));
                } else if (planned_status === 'Recusada') {
                    promises.push(apiTransferirCrianca(id, justificativa)); 
                } else if (planned_status === 'Fila de Espera') {
                    promises.push(apiMarcarFimDeFila(id, justificativa)); 
                } else if (planned_status === 'Convocado') {
                    if (planned_cmei_id && planned_turma_id && planned_cmei_nome && planned_turma_nome) {
                        const deadline = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                        promises.push(apiConvocarCrianca(id, { cmei_id: planned_cmei_id, turma_id: planned_turma_id }, planned_cmei_nome, planned_turma_nome, deadline));
                    }
                }
            } 
            
            // 2. Mudança de Vaga (Realocação)
            // Aplica realocação APENAS se o status for Matriculado/Matriculada E a vaga mudou
            if ((finalStatus === 'Matriculado' || finalStatus === 'Matriculada') && 
                (planned_cmei_id !== crianca.cmei_atual_id || planned_turma_id !== crianca.turma_atual_id)) {
                
                if (planned_cmei_id && planned_turma_id && planned_cmei_nome && planned_turma_nome) {
                    const key = `${planned_cmei_id}|${planned_turma_id}|${planned_cmei_nome}|${planned_turma_nome}`;
                    if (!realocacoes[key]) {
                        realocacoes[key] = [];
                    }
                    realocacoes[key].push(id);
                }
            }
        }
        
        // Executa Realocação em Massa
        for (const key in realocacoes) {
            const [cmei_id, turma_id, cmei_nome, turma_nome] = key.split('|');
            const criancaIds = realocacoes[key];
            
            promises.push(apiMassRealocate({
                criancaIds,
                cmei_id,
                turma_id,
                cmeiNome: cmei_nome,
                turmaNome: turma_nome,
            }));
        }
        
        // Executa todas as promessas em paralelo
        await Promise.all(promises);
        
        // Limpa o planejamento local após a execução bem-sucedida
        localStorage.removeItem(PLANNING_STORAGE_KEY);
        setLastSavedPlanning([]); // Limpa o estado salvo, forçando o recálculo baseado no DB
    };

    const transitionMutation = useMutation({
        mutationFn: executeTransition,
        onSuccess: () => {
            setPlanningData([]);
            queryClient.invalidateQueries({ queryKey: ["criancas"] });
            queryClient.invalidateQueries({ queryKey: TRANSICOES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['historicoGeral'] });
            toast.success(`Transição executada com sucesso!`, {
                description: `As crianças foram atualizadas conforme o planejamento.`,
            });
        },
        onError: (e: Error) => {
            // O erro de planejamento incompleto já é tratado com toast específico
            if (e.message !== "Planejamento incompleto.") {
                toast.error("Erro ao executar transição.", {
                    description: e.message,
                });
            }
        },
    });

    return {
        classificacao: planningData,
        isLoading,
        error,
        savePlanning,
        isSaving,
        executeTransition: transitionMutation.mutateAsync,
        isExecuting: transitionMutation.isPending,
        initialClassification, 
        hasUnsavedChanges, // Exportando o novo cálculo
        
        // Funções de planejamento
        updateCriancaStatusInPlanning,
        updateCriancaVagaInPlanning,
        massUpdateStatusInPlanning, // Corrigido: Esta função estava faltando no retorno
        massUpdateVagaInPlanning,
    };
}