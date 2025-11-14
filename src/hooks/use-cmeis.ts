import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipagem baseada na estrutura da tabela 'cmeis'
export interface Cmei {
  id: string; // UUID no Supabase, mas usaremos string
  nome: string;
  endereco: string;
  latitude?: string;
  longitude?: string;
  telefone?: string;
  email?: string;
  diretor?: string;
  coordenador?: string;
  capacidade: number;
  ocupacao: number;
  created_at: string;
}

// Tipagem para dados de formulário (sem campos gerados automaticamente)
export type CmeiFormData = Omit<Cmei, 'id' | 'capacidade' | 'ocupacao' | 'created_at'>;

const CMEIS_QUERY_KEY = ["cmeis"];

// --- Funções de API (Supabase) ---

const fetchCmeis = async (): Promise<Cmei[]> => {
  const { data, error } = await supabase
    .from('cmeis')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  // Ocupacao e capacidade são mockados como 0 no Supabase, mas o frontend espera números.
  // Aqui, forçamos a tipagem e garantimos que os campos existam.
  return data.map(c => ({
    ...c,
    id: c.id,
    capacidade: c.capacidade || 0,
    ocupacao: c.ocupacao || 0,
  })) as Cmei[];
};

const createCmei = async (data: CmeiFormData): Promise<Cmei> => {
  // Remove campos vazios para evitar erros de tipagem no Supabase
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== '' && value !== null)
  );
  
  const { data: newCmei, error } = await supabase
    .from('cmeis')
    .insert([
      { 
        ...payload,
        // Inicializa capacidade e ocupacao se não vierem do formulário (embora não estejam no CmeiFormData)
        capacidade: 0,
        ocupacao: 0,
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar CMEI: ${error.message}`);
  }
  return newCmei as Cmei;
};

const updateCmei = async (id: string, data: CmeiFormData): Promise<Cmei> => {
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== '' && value !== null)
  );
  
  const { data: updatedCmei, error } = await supabase
    .from('cmeis')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar CMEI: ${error.message}`);
  }
  return updatedCmei as Cmei;
};

const deleteCmei = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('cmeis')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir CMEI: ${error.message}`);
  }
};

// --- Hook Principal ---

export function useCMEIs() {
  const queryClient = useQueryClient();

  const { data: cmeis, isLoading, error } = useQuery<Cmei[]>({
    queryKey: CMEIS_QUERY_KEY,
    queryFn: fetchCmeis,
  });

  const createMutation = useMutation({
    mutationFn: createCmei,
    onSuccess: (newCmei) => {
      queryClient.invalidateQueries({ queryKey: CMEIS_QUERY_KEY });
      toast.success("CMEI cadastrado com sucesso!", {
        description: `O CMEI ${newCmei.nome} foi adicionado.`,
      });
    },
    onError: (e) => {
      toast.error("Erro ao cadastrar CMEI.", {
        description: e.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: CmeiFormData }) => updateCmei(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CMEIS_QUERY_KEY });
      toast.success("CMEI atualizado com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao atualizar CMEI.", {
        description: e.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCmei,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CMEIS_QUERY_KEY });
      toast.success("CMEI excluído com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao excluir CMEI.", {
        description: e.message,
      });
    },
  });

  return {
    cmeis: cmeis || [],
    isLoading,
    error,
    createCmei: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCmei: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCmei: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}