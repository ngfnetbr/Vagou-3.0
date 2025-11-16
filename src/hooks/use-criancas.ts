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
    fetchCriancasByTurmaId,
} from "@/integrations/supabase/criancas-api";
import { fetchHistoricoCrianca } from "@/integrations/supabase/historico-api";
import { fetchAvailableTurmas } from "@/integrations/supabase/vagas-api";
import { toast } from "sonner";
import { Crianca, ConvocationData } from "@/integrations/supabase/types";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { supabase } from "@/integrations/supabase/client";

const CRIANCAS_QUERY_KEY = 'criancas';
const HISTORICO_QUERY_KEY = 'historicoCrianca';
const AVAILABLE_TURMAS_QUERY_KEY = 'availableTurmas';
const TURMA_ALUNOS_QUERY_KEY = 'turmaAlunos';

// Hook para buscar a lista de crianças
export const useCriancas = () => {
  const queryClient = useQueryClient();
  
  const { data: criancas, isLoading, error } = useQuery<Crianca[], Error>({
    queryKey: [CRIANCAS_QUERY_KEY],
    queryFn: fetchCriancas,
  });
  
  // Helper para invalidar queries de criança e histórico
  const invalidateCriancaQueries = (criancaId: string) => {
      queryClient.invalidateQueries({ queryKey: [CRIANCAS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['historicoGeral'] }); // Key used in useHistoricoGeral
      queryClient.invalidateQueries({ queryKey: [HISTORICO_QUERY_KEY, criancaId] });
  };
  
  // --- Mutações com Logs ---
  
  // CRUD de Inscrição
  const { mutateAsync: addCrianca, isPending: isAdding } = useMutation({
    mutationFn: apiAddCrianca,
    onSuccess: (newCrianca) => {
      invalidateCriancaQueries(newCrianca.id);
      toast.success("Inscrição realizada com sucesso!");
    },
    onError: (e: Error) => {
      toast.error("Falha ao cadastrar criança", { description: e.message });
    },
  });
  
  const { mutateAsync: updateCrianca, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string, data: InscricaoFormData }) => apiUpdateCrianca(id, data).then(() => id),
    onSuccess: (criancaId) => {
      invalidateCriancaQueries(criancaId);
      toast.success("Dados da criança atualizados com sucesso!");
    },
    onError: (e: Error) => {
      toast.error("Falha ao atualizar dados da criança", { description: e.message });
    },
  });

  // 1. Confirmar Matrícula
  const { mutateAsync: confirmarMatricula, isPending: isConfirmingMatricula } = useMutation({
    mutationFn: async (criancaId: string) => {
        const crianca = await getCriancaById(criancaId);
        if (!crianca || !crianca.cmeiNome || !crianca.turmaNome) {
            throw new Error("Dados de CMEI/Turma ausentes para confirmação.");
        }
        await apiConfirmarMatricula(crianca.id, crianca.cmeiNome, crianca.turmaNome);
        return crianca.id;
    },
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        queryClient.invalidateQueries({ queryKey: [TURMA_ALUNOS_QUERY_KEY] }); // Invalida alunos da turma
        toast.success("Matrícula confirmada com sucesso!");
    },
    onError: (e: Error) => {
      toast.error("Falha ao confirmar matrícula", { description: e.message });
    },
  });

  // 2. Marcar Recusada
  const { mutateAsync: marcarRecusada, isPending: isMarkingRecusada } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiMarcarRecusada(id, justificativa).then(() => id),
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        queryClient.invalidateQueries({ queryKey: [TURMA_ALUNOS_QUERY_KEY] });
        toast.success("Convocação marcada como recusada.");
    },
    onError: (e: Error) => {
      toast.error("Falha ao recusar convocação", { description: e.message });
    },
  });

  // 3. Marcar Desistente
  const { mutateAsync: marcarDesistente, isPending: isMarkingDesistente } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiMarcarDesistente(id, justificativa).then(() => id),
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        queryClient.invalidateQueries({ queryKey: [TURMA_ALUNOS_QUERY_KEY] });
        toast.success("Criança marcada como desistente.");
    },
    onError: (e: Error) => {
      toast.error("Falha ao marcar desistência", { description: e.message });
    },
  });

  // 4. Marcar Fim de Fila
  const { mutateAsync: marcarFimDeFila, isPending: isMarkingFimDeFila } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiMarcarFimDeFila(id, justificativa).then(() => id),
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        toast.success("Criança movida para o fim da fila (penalidade aplicada).");
    },
    onError: (e: Error) => {
      toast.error("Falha ao aplicar fim de fila", { description: e.message });
    },
  });

  // 5. Reativar na Fila
  const { mutateAsync: reativarCrianca, isPending: isReactivating } = useMutation({
    mutationFn: (id: string) => apiReativarCrianca(id).then(() => id),
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        toast.success("Criança reativada na fila de espera.");
    },
    onError: (e: Error) => {
      toast.error("Falha ao reativar criança", { description: e.message });
    },
  });
  
  // 6. Convocar Criança
  const { mutateAsync: convocarCrianca, isPending: isConvoking } = useMutation({
    mutationFn: async ({ criancaId, data, cmeiNome, turmaNome, deadline }: { criancaId: string, data: ConvocationData, cmeiNome: string, turmaNome: string, deadline: string }) => {
        await apiConvocarCrianca(criancaId, data, cmeiNome, turmaNome, deadline);
        return criancaId;
    },
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        queryClient.invalidateQueries({ queryKey: [TURMA_ALUNOS_QUERY_KEY] });
        toast.success("Criança convocada com sucesso!");
    },
    onError: (e: Error) => {
      toast.error("Falha ao convocar criança", { description: e.message });
    },
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
        return id;
    },
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        queryClient.invalidateQueries({ queryKey: [TURMA_ALUNOS_QUERY_KEY] });
        toast.success("Criança realocada com sucesso!");
    },
    onError: (e: Error) => {
      toast.error("Falha ao realocar criança", { description: e.message });
    },
  });
  
  // 8. Transferir Criança (Encerra matrícula por mudança de cidade)
  const { mutateAsync: transferirCrianca, isPending: isTransferring } = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => 
        apiTransferirCrianca(id, justificativa).then(() => id),
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        queryClient.invalidateQueries({ queryKey: [TURMA_ALUNOS_QUERY_KEY] });
        toast.success("Matrícula encerrada por transferência.");
    },
    onError: (e: Error) => {
      toast.error("Falha ao transferir criança", { description: e.message });
    },
  });
  
  // 9. Solicitar Remanejamento (NOVA ASSINATURA)
  const { mutateAsync: solicitarRemanejamento, isPending: isRequestingRemanejamento } = useMutation({
    mutationFn: async ({ id, cmeiId, cmeiNome, justificativa }: { id: string, cmeiId: string, cmeiNome: string, justificativa: string }) => {
        await apiSolicitarRemanejamento(id, cmeiId, cmeiNome, justificativa);
        return id;
    },
    onSuccess: (criancaId) => {
        invalidateCriancaQueries(criancaId);
        toast.success("Solicitação de remanejamento registrada. Criança na fila de prioridade máxima.");
    },
    onError: (e: Error) => {
      toast.error("Falha ao solicitar remanejamento", { description: e.message });
    },
  });
  
  // 10. Excluir Criança
  const { mutateAsync: deleteCrianca, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
        const nome = criancas?.find(c => c.id === id)?.nome || 'Criança';
        await apiDeleteCrianca(id, nome);
        return id;
    },
    onSuccess: (criancaId) => {
      queryClient.invalidateQueries({ queryKey: [CRIANCAS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['historicoGeral'] });
      queryClient.invalidateQueries({ queryKey: [HISTORICO_QUERY_KEY, criancaId] });
      queryClient.invalidateQueries({ queryKey: [TURMA_ALUNOS_QUERY_KEY] });
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
    updateCrianca: (args: { id: string, data: InscricaoFormData }) => updateCrianca(args),
    isUpdating,
    deleteCrianca: (id: string) => deleteCrianca(id),
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
    solicitarRemanejamento: (args: { id: string, cmeiId: string, cmeiNome: string, justificativa: string }) => solicitarRemanejamento(args),
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

// NOVO HOOK: Busca crianças ativas por ID da Turma
export const useCriancasByTurma = (turmaId: string | undefined) => {
    return useQuery<Crianca[], Error>({
        queryKey: [TURMA_ALUNOS_QUERY_KEY, turmaId],
        queryFn: () => fetchCriancasByTurmaId(turmaId!),
        enabled: !!turmaId,
    });
};