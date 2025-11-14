import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipagem baseada na estrutura da tabela 'turmas_base'
export interface TurmaBase {
  id: number;
  nome: string;
  idade_minima_meses: number;
  idade_maxima_meses: number;
  descricao?: string;
  created_at: string;
}

// Tipagem para dados de formulário (sem campos gerados automaticamente)
export type TurmaBaseFormData = Omit<TurmaBase, 'id' | 'created_at'>;

const TURMAS_BASE_QUERY_KEY = ["turmasBase"];

// --- Funções de API (Supabase) ---

const fetchTurmasBase = async (): Promise<TurmaBase[]> => {
  const { data, error } = await supabase
    .from('turmas_base')
    .select('*')
    .order('idade_minima_meses', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as TurmaBase[];
};

const createTurmaBase = async (data: TurmaBaseFormData): Promise<TurmaBase> => {
  const payload = {
    nome: data.nome,
    idade_minima_meses: data.idade_minima_meses,
    idade_maxima_meses: data.idade_maxima_meses,
    descricao: data.descricao || null,
  };
  
  const { data: newTurmaBase, error } = await supabase
    .from('turmas_base')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar Turma Base: ${error.message}`);
  }
  return newTurmaBase as TurmaBase;
};

const updateTurmaBase = async (id: number, data: TurmaBaseFormData): Promise<TurmaBase> => {
  const payload = {
    nome: data.nome,
    idade_minima_meses: data.idade_minima_meses,
    idade_maxima_meses: data.idade_maxima_meses,
    descricao: data.descricao || null,
  };
  
  const { data: updatedTurmaBase, error } = await supabase
    .from('turmas_base')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar Turma Base: ${error.message}`);
  }
  return updatedTurmaBase as TurmaBase;
};

const deleteTurmaBase = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('turmas_base')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir Turma Base: ${error.message}`);
  }
};

// --- Hook Principal ---

export function useTurmasBase() {
  const queryClient = useQueryClient();

  const { data: turmasBase, isLoading, error } = useQuery<TurmaBase[]>({
    queryKey: TURMAS_BASE_QUERY_KEY,
    queryFn: fetchTurmasBase,
  });

  const createMutation = useMutation({
    mutationFn: createTurmaBase,
    onSuccess: (newTurmaBase) => {
      queryClient.invalidateQueries({ queryKey: TURMAS_BASE_QUERY_KEY });
      toast.success("Turma Base cadastrada com sucesso!", {
        description: `A turma ${newTurmaBase.nome} foi adicionada.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao cadastrar Turma Base.", {
        description: e.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: TurmaBaseFormData }) => updateTurmaBase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TURMAS_BASE_QUERY_KEY });
      toast.success("Turma Base atualizada com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao atualizar Turma Base.", {
        description: e.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTurmaBase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TURMAS_BASE_QUERY_KEY });
      toast.success("Turma Base excluída com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao excluir Turma Base.", {
        description: e.message,
      });
    },
  });

  return {
    turmasBase: turmasBase || [],
    isLoading,
    error,
    createTurmaBase: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTurmaBase: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTurmaBase: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}