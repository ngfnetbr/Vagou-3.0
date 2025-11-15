import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    apiConfirmarMatricula, 
    apiMarcarRecusada, 
    apiMarcarDesistente, 
    apiMarcarFimDeFila, 
    apiReativarCrianca, 
    apiConvocarCrianca, 
    apiDeleteCrianca, 
    fetchCriancas, 
    fetchCriancaDetails,
    apiAddCrianca,
    apiUpdateCrianca,
    apiRealocarCrianca,
    apiTransferirCrianca,
    apiSolicitarRemanejamento,
    getCriancaById,
} from "@/integrations/supabase/criancas-api";
import { fetchHistoricoCrianca } from "@/integrations/supabase/historico-api";
import { fetchAvailableTurmas } from "@/integrations/supabase/vagas-api";
import { toast } from "sonner";
import { Crianca, ConvocationData } from "@/integrations/supabase/types";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";

const CRIANCAS_QUERY_KEY = 'criancas';
const HISTORICO_QUERY_KEY = 'historicoCrianca';
const AVAILABLE_TURMAS_QUERY_KEY = 'availableTurmas';

// Hook para buscar a lista de crianças
export const useCriancas = () => {
  const queryClient = useQueryClient();
  
  const { data: criancas, isLoading, error } = useQuery<Crianca[], Error>({
    queryKey: [CRIANCAS_QUERY_KEY],
    queryFn: fetchCriancas,
  });
  
  // --- Mutações com Logs ---

  const mutationOptions = (successMessage: string, errorMessage: string) => ({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CRIANCAS_QUERY_KEY] });
      toast.success(successMessage);
    },
    onError: (e: Error) => {
      toast.error(errorMessage, { description: e.message });
    },
  });
  
  // CRUD de Inscrição
  const { mutateAsync: addCrianca, isPending: isAdding } = useMutation({
    mutationFn: apiAddCrianca,
    ...mutationOptions("Inscrição realizada com sucesso!", "Falha ao cadastrar criança"),
  });
  
  const { mutateAsync: updateCrianca, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string, data: InscricaoFormData }) => apiUpdateCrianca(id, data),
    ...mutationOptions("Dados da criança atualizados com sucesso!", "Falha ao atualizar dados da criança"),
  });

  // 1. Confirmar Matrícula
  const { mutateAsync: confirmarMatricula, isPending: isConfirmingMatricula } = useMutation({
    mutationFn: async (criancaId: string) => {
        const crianca = await getCriancaById(criancaId);
        if (!crianca || !crianca.cmeiNome || !crianca.turmaNome) {
            throw new Error("Dados de CMEI/Turma ausentes para confirmação.");
        }
        await apiConfirmarMatricula(crianca.id, crianca.cmeiNome, crianca.turmaNome);
    },
    ...mutationOptions("Matrícula confirmada com sucesso!", "Falha ao confirmar matrícula"),
  });

  // 2. Marcar Recusada
  const { mutateAsync: marcarRecusada, isPending: isMarkingRecusada } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiMarcarRecusada(id, justificativa),
    ...mutationOptions("Convocação marcada como recusada.", "Falha ao recusar convocação"),
  });

  // 3. Marcar Desistente
  const { mutateAsync: marcarDesistente, isPending: isMarkingDesistente } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiMarcarDesistente(id, justificativa),
    ...mutationOptions("Criança marcada como desistente.", "Falha ao marcar desistência"),
  });

  // 4. Marcar Fim de Fila
  const { mutateAsync: marcarFimDeFila, isPending: isMarkingFimDeFila } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiMarcarFimDeFila(id, justificativa),
    ...mutationOptions("Criança movida para o fim da fila (penalidade aplicada).", "Falha ao aplicar fim de fila"),
  });

  // 5. Reativar na Fila
  const { mutateAsync: reativarCrianca, isPending: isReactivating } = useMutation({
    mutationFn: (id: string) => apiReativarCrianca(id),
    ...mutationOptions("Criança reativada na fila de espera.", "Falha ao reativar criança"),
  });
  
  // 6. Convocar Criança
  const { mutateAsync: convocarCrianca, isPending: isConvoking } = useMutation({
    mutationFn: async ({ criancaId, data, cmeiNome, turmaNome, deadline }: { criancaId: string, data: ConvocationData, cmeiNome: string, turmaNome: string, deadline: string }) => {
        await apiConvocarCrianca(criancaId, data, cmeiNome, turmaNome, deadline);
    },
    ...mutationOptions("Criança convocada com sucesso!", "Falha ao convocar criança"),
  });
  
  // 7. Realocar Criança (Mudar Turma dentro do mesmo CMEI)
  const { mutateAsync: realocarCrianca, isPending: isRealocating } = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: ConvocationData }) => {
        const crianca = await getCriancaById(id);
        const cmeiNome = crianca?.cmeiNome || 'CMEI Desconhecido';
        
        // Busca o nome da turma no DB (ou cache)
        const { data: turmaData } = await supabase
            .from('turmas')
            .select('nome')
            .eq('id', data.turma_id)
            .single();
            
        const turmaNome = turmaData?.nome || 'Turma Desconhecida';
        
        await apiRealocarCrianca(id, data, cmeiNome, turmaNome);
    },
    ...mutationOptions("Criança realocada com sucesso!", "Falha ao realocar criança"),
  });
  
  // 8. Transferir Criança (Encerra matrícula por mudança de cidade)
  const { mutateAsync: transferirCrianca, isPending: isTransferring } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiTransferirCrianca(id, justificativa),
    ...mutationOptions("Matrícula encerrada por transferência.", "Falha ao transferir criança"),
  });
  
  // 9. Solicitar Remanejamento
  const { mutateAsync: solicitarRemanejamento, isPending: isRequestingRemanejamento } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiSolicitarRemanejamento(id, justificativa),
    ...mutationOptions("Solicitação de remanejamento registrada.", "Falha ao solicitar remanejamento"),
  });
  
  // 10. Excluir Criança
  const { mutateAsync: deleteCrianca, isPending: isDeleting } = useMutation({
    mutationFn: async ({ id, nome }: { id: string, nome: string }) => {
        await apiDeleteCrianca(id, nome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CRIANCAS_QUERY_KEY] });
      toast.success("Criança excluída com sucesso.");
    },
    onError: (e: Error) => {
      toast.error("Falha na exclusão", { description: e.message });
    },
  });

  return {
    criancas: criancas || [],
    isLoading,
    error,
    refetch: () => queryClient.invalidateQueries({ queryKey: [CRIANCAS_QUERY_KEY] }),
    
    // CRUD
    addCrianca,
    isAdding,
    updateCrianca,
    isUpdating,
    deleteCrianca: (id: string) => deleteCrianca({ id, nome: criancas?.find(c => c.id === id)?.nome || 'Criança' }),
    isDeleting,
    
    // Mutações de Status
    confirmarMatricula: (id: string) => confirmarMatricula(id),
    isConfirmingMatricula,
    marcarRecusada,
    isMarkingRecusada,
    marcarDesistente,
    isMarkingDesistente,
    marcarFimDeFila,
    isMarkingFimDeFila,
    reativarCrianca,
    isReactivating,
    convocarCrianca,
    isConvoking,
    realocarCrianca,
    isRealocating,
    transferirCrianca,
    isTransferring,
    solicitarRemanejamento,
    isRequestingRemanejamento,
  };
};

// Hook para buscar detalhes de uma criança
export const useCriancaDetails = (id: string) => {
  return useQuery<Crianca, Error>({
    queryKey: [CRIANCAS_QUERY_KEY, id],
    queryFn: () => fetchCriancaDetails(id),
    enabled: !!id,
  });
};

// Hook para buscar o histórico de uma criança
export const useCriancaHistorico = (criancaId: string) => {
    return useQuery({
        queryKey: [HISTORICO_QUERY_KEY, criancaId],
        queryFn: () => fetchHistoricoCrianca(criancaId),
        enabled: !!criancaId,
    });
};

// Hook para buscar turmas disponíveis para convocação/realocação
export const useAvailableTurmas = (criancaId: string) => {
    return useQuery({
        queryKey: [AVAILABLE_TURMAS_QUERY_KEY, criancaId],
        queryFn: () => fetchAvailableTurmas(criancaId),
        enabled: !!criancaId,
    });
};