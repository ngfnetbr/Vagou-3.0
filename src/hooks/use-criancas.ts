import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { toast } from "sonner";
import { Crianca, ConvocationData, HistoricoEntry } from "@/integrations/supabase/types";
import { fetchCriancas, getCriancaById, addCriancaFromInscricao, updateCrianca, deleteCrianca, checkCriancaDuplicada } from "@/integrations/supabase/criancas-api";
import { convocarCrianca, marcarDesistente, reativarCrianca, marcarFimDeFila, confirmarMatricula, marcarRecusada, realocarCrianca, transferirCrianca, solicitarRemanejamento } from "@/integrations/supabase/status-mutations";
import { fetchAvailableTurmas } from "@/integrations/supabase/vagas-api";
import { fetchHistoricoCrianca } from "@/integrations/supabase/historico-api";


const CRIANCAS_QUERY_KEY = ["criancas"];

// Função de exclusão com verificação de status
const deleteCriancaWithCheck = async (id: string): Promise<void> => {
    const crianca = await getCriancaById(id);
    if (!crianca) {
        throw new Error("Criança não encontrada.");
    }
    
    const activeStatuses = ["Matriculado", "Matriculada", "Fila de Espera", "Convocado", "Remanejamento Solicitado"];
    if (activeStatuses.includes(crianca.status)) {
        throw new Error(`Não é possível excluir. A criança está com status ativo: ${crianca.status}. Marque como 'Desistente' ou 'Recusada' primeiro.`);
    }
    
    // Se o status não for ativo, procede com a exclusão
    return deleteCrianca(id);
};


export function useCriancas() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (data: InscricaoFormData) => {
      // 1. Verificar duplicidade antes de inserir
      const isDuplicate = await checkCriancaDuplicada(data);
      if (isDuplicate) {
        throw new Error("Já existe um cadastro no sistema com os dados informados.");
      }
      
      // 2. Inserir se não for duplicado
      return addCriancaFromInscricao(data);
    },
    onSuccess: (newCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      toast.success("Criança cadastrada com sucesso!", {
        description: `A criança ${newCrianca.nome} foi adicionada à ${newCrianca.status}.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao cadastrar criança.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });

  const { data: criancas, isLoading, error } = useQuery<Crianca[]>({
    queryKey: CRIANCAS_QUERY_KEY,
    queryFn: fetchCriancas,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: InscricaoFormData }) => updateCrianca(id, data),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.success("Dados da criança atualizados!", {
        description: `As informações de ${updatedCrianca.nome} foram salvas.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao atualizar criança.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCriancaWithCheck, // Usando a função com a verificação
    onSuccess: (_, id) => { 
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      toast.success("Criança excluída com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao excluir criança.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  
  const convocarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ConvocationData }) => convocarCrianca(id, data),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY }); 
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.success("Convocação enviada!", {
        description: `${updatedCrianca.nome} foi convocado(a) para ${updatedCrianca.cmeiNome}.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao convocar criança.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  
  const confirmarMatriculaMutation = useMutation({
    mutationFn: confirmarMatricula,
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.success("Matrícula Confirmada!", {
        description: `${updatedCrianca.nome} foi matriculado(a) no CMEI ${updatedCrianca.cmeiNome}.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao confirmar matrícula.", {
        description: e.message || "A criança pode não estar em status de convocação.",
      });
    },
  });
  
  const marcarRecusadaMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => marcarRecusada(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.warning("Convocação Recusada.", {
        description: `${updatedCrianca.nome} foi marcado(a) como Recusado(a).`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao marcar recusa.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });

  const desistenteMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => marcarDesistente(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY }); 
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.warning("Criança marcada como desistente.", {
        description: `${updatedCrianca.nome} foi removido(a) da lista de matrículas.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao marcar desistência.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  
  const reativarMutation = useMutation({
    mutationFn: reativarCrianca,
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.success("Criança reativada!", {
        description: `${updatedCrianca.nome} foi colocada no final da fila de espera.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao reativar criança.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  
  const fimDeFilaMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => marcarFimDeFila(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.info("Criança movida para o fim da fila.", {
        description: `${updatedCrianca.nome} recusou a convocação e foi para o final da fila.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao marcar fim de fila.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  
  // --- NOVAS MUTAÇÕES DE MATRÍCULA ---
  
  const realocarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ConvocationData }) => realocarCrianca(id, data),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.success("Realocação concluída!", {
        description: `${updatedCrianca.nome} foi realocado(a) para ${updatedCrianca.turmaNome} no CMEI ${updatedCrianca.cmeiNome}.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao realocar criança.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  
  const transferirMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => transferirCrianca(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.warning("Transferência (Mudança de Cidade) concluída.", {
        description: `${updatedCrianca.nome} foi marcado(a) como desistente devido à transferência.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao transferir criança.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  
  const solicitarRemanejamentoMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: string, justificativa: string }) => solicitarRemanejamento(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.info("Solicitação de Remanejamento enviada.", {
        description: `O status de ${updatedCrianca.nome} foi atualizado para Remanejamento Solicitado.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao solicitar remanejamento.", {
        description: e.message || "Tente novamente mais tarde.",
      });
    },
  });
  

  return {
    criancas: criancas || [],
    isLoading,
    error,
    addCrianca: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateCrianca: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCrianca: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    convocarCrianca: convocarMutation.mutateAsync,
    isConvoking: convocarMutation.isPending,
    confirmarMatricula: confirmarMatriculaMutation.mutateAsync,
    isConfirmingMatricula: confirmarMatriculaMutation.isPending,
    marcarRecusada: marcarRecusadaMutation.mutateAsync,
    isMarkingRecusada: marcarRecusadaMutation.isPending,
    marcarDesistente: desistenteMutation.mutateAsync,
    isMarkingDesistente: desistenteMutation.isPending,
    reativarCrianca: reativarMutation.mutateAsync,
    isReactivating: reativarMutation.isPending,
    marcarFimDeFila: fimDeFilaMutation.mutateAsync,
    isMarkingFimDeFila: fimDeFilaMutation.isPending,
    
    // Novas mutações
    realocarCrianca: realocarMutation.mutateAsync,
    isRealocating: realocarMutation.isPending,
    transferirCrianca: transferirMutation.mutateAsync,
    isTransferring: transferirMutation.isPending,
    solicitarRemanejamento: solicitarRemanejamentoMutation.mutateAsync,
    isRequestingRemanejamento: solicitarRemanejamentoMutation.isPending,
  };
}

export function useCriancaDetails(id: string) {
    const queryClient = useQueryClient();
    
    return useQuery<Crianca | undefined>({
        queryKey: ['crianca', id],
        queryFn: () => getCriancaById(id),
        enabled: !!id,
        // Adiciona o histórico ao cache da query de detalhes
        select: (crianca) => {
            if (crianca) {
                queryClient.prefetchQuery({
                    queryKey: ['historico', crianca.id],
                    queryFn: () => fetchHistoricoCrianca(crianca.id),
                });
            }
            return crianca;
        }
    });
}

export function useCriancaHistorico(criancaId: string) {
    return useQuery<HistoricoEntry[]>({
        queryKey: ['historico', criancaId],
        queryFn: () => fetchHistoricoCrianca(criancaId),
        enabled: !!criancaId,
    });
}

export function useAvailableTurmas(criancaId: string) {
    return useQuery({
        queryKey: ['availableTurmas', criancaId],
        queryFn: () => fetchAvailableTurmas(criancaId),
        enabled: !!criancaId,
    });
}