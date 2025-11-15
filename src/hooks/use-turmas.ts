import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkTurmaHasActiveCriancas } from "@/integrations/supabase/cmeis-turmas-api"; // Importando verificação

// Tipagem baseada na estrutura da tabela 'turmas'
export interface Turma {
  id: string; // UUID
  cmei_id: string; // UUID do CMEI
  turma_base_id: number; // ID da Turma Base
  nome: string; // Nome da turma (ex: Manhã, Tarde)
  sala: string; // Sala (ex: A, B, C)
  capacidade: number;
  ocupacao: number;
  created_at: string;
  // Campos de relacionamento (para JOINs futuros, mas mantemos a estrutura base aqui)
}

// Tipagem para dados de formulário (sem campos gerados automaticamente)
export type TurmaFormData = Omit<Turma, 'id' | 'ocupacao' | 'created_at'>;

const TURMAS_QUERY_KEY = ["turmas"];

// --- Funções de API (Supabase) ---

const fetchTurmas = async (): Promise<Turma[]> => {
  // Em um sistema real, faríamos um JOIN com cmeis e turmas_base.
  // Por enquanto, buscamos apenas os dados da tabela 'turmas'.
  const { data, error } = await supabase
    .from('turmas')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  // Garantindo que ocupacao seja 0 se for null/undefined
  return data.map(t => ({
    ...t,
    ocupacao: t.ocupacao || 0,
    id: t.id,
    cmei_id: t.cmei_id,
    turma_base_id: t.turma_base_id,
    capacidade: t.capacidade,
    nome: t.nome,
    sala: t.sala,
    created_at: t.created_at,
  })) as Turma[];
};

const createTurma = async (data: TurmaFormData): Promise<Turma> => {
  const payload = {
    ...data,
    ocupacao: 0, // Sempre começa com 0
  };
  
  const { data: newTurma, error } = await supabase
    .from('turmas')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar Turma: ${error.message}`);
  }
  return newTurma as Turma;
};

const updateTurma = async (id: string, data: Partial<TurmaFormData>): Promise<Turma> => {
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== '' && value !== null)
  );
  
  const { data: updatedTurma, error } = await supabase
    .from('turmas')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar Turma: ${error.message}`);
  }
  return updatedTurma as Turma;
};

const deleteTurma = async (id: string): Promise<void> => {
  // 1. Verificar se há crianças ativas na turma
  const hasActiveCriancas = await checkTurmaHasActiveCriancas(id);
  if (hasActiveCriancas) {
    throw new Error("Não é possível excluir. Esta turma possui crianças matriculadas ou convocadas.");
  }
  
  const { error } = await supabase
    .from('turmas')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir Turma: ${error.message}`);
  }
};

// --- Hook Principal ---

export function useTurmas() {
  const queryClient = useQueryClient();

  const { data: turmas, isLoading, error } = useQuery<Turma[]>({
    queryKey: TURMAS_QUERY_KEY,
    queryFn: fetchTurmas,
  });

  const createMutation = useMutation({
    mutationFn: createTurma,
    onSuccess: (newTurma) => {
      queryClient.invalidateQueries({ queryKey: TURMAS_QUERY_KEY });
      toast.success("Turma cadastrada com sucesso!", {
        description: `A turma ${newTurma.nome} foi adicionada.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao cadastrar Turma.", {
        description: e.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<TurmaFormData> }) => updateTurma(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TURMAS_QUERY_KEY });
      toast.success("Turma atualizada com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao atualizar Turma.", {
        description: e.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTurma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TURMAS_QUERY_KEY });
      toast.success("Turma excluída com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao excluir Turma.", {
        description: e.message,
      });
    },
  });

  return {
    turmas: turmas || [],
    isLoading,
    error,
    createTurma: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTurma: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTurma: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}