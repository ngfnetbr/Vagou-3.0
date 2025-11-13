import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCriancas, addCriancaFromInscricao, InscricaoFormData, Crianca, updateCrianca, deleteCrianca, getCriancaById, convocarCrianca, marcarDesistente, fetchAvailableTurmas, ConvocationData, reativarCrianca, marcarFimDeFila, confirmarMatricula, marcarRecusada } from "@/lib/mock-data";
import { toast } from "sonner";

const CRIANCAS_QUERY_KEY = ["criancas"];

export function useCriancas() {
  const queryClient = useQueryClient();

  const { data: criancas, isLoading, error } = useQuery<Crianca[]>({
    queryKey: CRIANCAS_QUERY_KEY,
    queryFn: fetchCriancas,
  });

  const addMutation = useMutation({
    mutationFn: addCriancaFromInscricao,
    onSuccess: (newCrianca) => {
      queryClient.setQueryData<Crianca[]>(CRIANCAS_QUERY_KEY, (old) => {
        if (old) {
          return [...old, newCrianca];
        }
        return [newCrianca];
      });
      toast.success("Criança cadastrada com sucesso!", {
        description: `A criança ${newCrianca.nome} foi adicionada à ${newCrianca.status}.`,
      });
    },
    onError: () => {
      toast.error("Erro ao cadastrar criança.", {
        description: "Tente novamente mais tarde.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: InscricaoFormData }) => updateCrianca(id, data),
    onSuccess: (updatedCrianca) => {
      queryClient.setQueryData<Crianca[]>(CRIANCAS_QUERY_KEY, (old) => {
        return old ? old.map(c => c.id === updatedCrianca.id ? updatedCrianca : c) : [updatedCrianca];
      });
      // Invalidate the specific detail query
      queryClient.invalidateQueries({ queryKey: ['crianca', updatedCrianca.id] });
      toast.success("Dados da criança atualizados!", {
        description: `As informações de ${updatedCrianca.nome} foram salvas.`,
      });
    },
    onError: () => {
      toast.error("Erro ao atualizar criança.", {
        description: "Tente novamente mais tarde.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCrianca,
    onSuccess: (_, id) => { // FIX: Use the second argument (variables) which is the ID passed to mutate
      queryClient.setQueryData<Crianca[]>(CRIANCAS_QUERY_KEY, (old) => {
        return old ? old.filter(c => c.id !== id) : [];
      });
      toast.success("Criança excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir criança.", {
        description: "Tente novamente mais tarde.",
      });
    },
  });
  
  const convocarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ConvocationData }) => convocarCrianca(id, data),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY }); // Refetch the list to update the queue position
      toast.success("Convocação enviada!", {
        description: `${updatedCrianca.nome} foi convocado(a) para ${updatedCrianca.cmei}.`,
      });
    },
    onError: () => {
      toast.error("Erro ao convocar criança.", {
        description: "Tente novamente mais tarde.",
      });
    },
  });
  
  const confirmarMatriculaMutation = useMutation({
    mutationFn: confirmarMatricula,
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      toast.success("Matrícula Confirmada!", {
        description: `${updatedCrianca.nome} foi matriculado(a) no CMEI ${updatedCrianca.cmei}.`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao confirmar matrícula.", {
        description: error.message || "A criança pode não estar em status de convocação.",
      });
    },
  });
  
  const marcarRecusadaMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: number, justificativa: string }) => marcarRecusada(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      toast.warning("Convocação Recusada.", {
        description: `${updatedCrianca.nome} foi marcado(a) como Recusado(a).`,
      });
    },
    onError: () => {
      toast.error("Erro ao marcar recusa.", {
        description: "Tente novamente mais tarde.",
      });
    },
  });

  const desistenteMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: number, justificativa: string }) => marcarDesistente(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY }); // Refetch the list to update the queue position
      toast.warning("Criança marcada como desistente.", {
        description: `${updatedCrianca.nome} foi removido(a) da fila.`,
      });
    },
    onError: () => {
      toast.error("Erro ao marcar desistência.", {
        description: "Tente novamente mais tarde.",
      });
    },
  });
  
  const reativarMutation = useMutation({
    mutationFn: reativarCrianca,
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      toast.success("Criança reativada!", {
        description: `${updatedCrianca.nome} foi colocada no final da fila de espera.`,
      });
    },
    onError: () => {
      toast.error("Erro ao reativar criança.", {
        description: "Tente novamente mais tarde.",
      });
    },
  });
  
  const fimDeFilaMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: number, justificativa: string }) => marcarFimDeFila(id, justificativa),
    onSuccess: (updatedCrianca) => {
      queryClient.invalidateQueries({ queryKey: CRIANCAS_QUERY_KEY });
      toast.info("Criança movida para o fim da fila.", {
        description: `${updatedCrianca.nome} recusou a convocação e foi para o final da fila.`,
      });
    },
    onError: () => {
      toast.error("Erro ao marcar fim de fila.", {
        description: "Tente novamente mais tarde.",
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
  };
}

export function useCriancaDetails(id: number) {
    return useQuery<Crianca | undefined>({
        queryKey: ['crianca', id],
        queryFn: () => getCriancaById(id),
        enabled: !!id,
    });
}

export function useAvailableTurmas(criancaId: number) {
    return useQuery({
        queryKey: ['availableTurmas', criancaId],
        queryFn: () => fetchAvailableTurmas(criancaId),
        enabled: !!criancaId,
    });
}