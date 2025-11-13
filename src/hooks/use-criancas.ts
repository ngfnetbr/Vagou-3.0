import { useQuery, useMutation, useQueryClient, UseMutateAsyncFunction } from "@tanstack/react-query";
import {
  getCriancas,
  addCriancaMock,
  updateCriancaMock,
  deleteCriancaMock,
  Crianca,
  updateCriancaStatusMock,
  CriancaStatus,
} from "@/lib/mock-data";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { toast } from "sonner";

// Tipos para as mutações
interface UpdateCriancaData {
  id: number;
  data: InscricaoFormData;
}

interface UpdateStatusData {
    id: number;
    newStatus: CriancaStatus;
    action: string;
    cmei: string;
}

export const useCriancas = () => {
  const queryClient = useQueryClient();

  // Query para buscar todas as crianças
  const {
    data: criancas,
    isLoading,
    error,
  } = useQuery<Crianca[], Error>({
    queryKey: ["criancas"],
    queryFn: getCriancas,
  });

  // Mutação para adicionar uma nova criança
  const { mutateAsync: addCrianca, isPending: isAdding } = useMutation<
    Crianca,
    Error,
    InscricaoFormData
  >({
    mutationFn: addCriancaMock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criancas"] });
      toast.success("Criança cadastrada com sucesso!", {
        description: "Adicionada à fila de espera.",
      });
    },
    onError: (err) => {
      toast.error("Erro ao cadastrar criança.", {
        description: err.message,
      });
    },
  });

  // Mutação para atualizar uma criança existente
  const { mutateAsync: updateCrianca, isPending: isUpdating } = useMutation<
    Crianca | undefined,
    Error,
    UpdateCriancaData
  >({
    mutationFn: ({ id, data }) => updateCriancaMock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criancas"] });
      toast.success("Dados da criança atualizados com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao atualizar criança.", {
        description: err.message,
      });
    },
  });

  // Mutação para deletar uma criança
  const { mutateAsync: deleteCrianca, isPending: isDeleting } = useMutation<
    boolean,
    Error,
    number
  >({
    mutationFn: deleteCriancaMock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criancas"] });
      toast.success("Criança excluída com sucesso.");
    },
    onError: (err) => {
      toast.error("Erro ao excluir criança.", {
        description: err.message,
      });
    },
  });

  // Mutação para atualizar o status da criança
  const { mutateAsync: updateCriancaStatus, isPending: isUpdatingStatus } = useMutation<
    Crianca | undefined,
    Error,
    UpdateStatusData
  >({
    mutationFn: ({ id, newStatus, action, cmei }) => updateCriancaStatusMock(id, newStatus, action, cmei),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criancas"] });
    },
    onError: (err) => {
      toast.error("Erro ao atualizar status.", {
        description: err.message,
      });
    },
  });

  return {
    criancas: criancas || [],
    isLoading,
    error,
    addCrianca: addCrianca as UseMutateAsyncFunction<Crianca, Error, InscricaoFormData, unknown>,
    isAdding,
    updateCrianca: updateCrianca as UseMutateAsyncFunction<Crianca | undefined, Error, UpdateCriancaData, unknown>,
    isUpdating,
    deleteCrianca: deleteCrianca as UseMutateAsyncFunction<boolean, Error, number, unknown>,
    isDeleting,
    updateCriancaStatus: updateCriancaStatus as UseMutateAsyncFunction<Crianca | undefined, Error, UpdateStatusData, unknown>,
    isUpdatingStatus,
  };
};