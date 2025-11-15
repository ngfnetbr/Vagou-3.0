import { useQuery, useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { fetchCmeis, fetchTurmasByCmei } from "@/integrations/supabase/cmeis-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkCmeiHasTurmas, checkCmeiHasActiveCriancas } from "@/integrations/supabase/cmeis-turmas-api";

// --- Tipagens Exportadas ---

export interface Cmei {
    id: string;
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

export interface Turma {
    id: string;
    cmei_id: string;
    nome: string;
    sala: string;
    capacidade: number;
    ocupacao: number;
    turma_base_id: number;
}

// Tipagem para dados de formulário (sem campos gerados automaticamente)
export type CmeiFormData = Omit<Cmei, 'id' | 'capacidade' | 'ocupacao' | 'created_at'>;

// Tipagem para dados de seed (inclui capacidade inicial)
export type CmeiSeedData = Omit<Cmei, 'id' | 'ocupacao' | 'created_at'>;

// --- Funções de API (CRUD) ---

const createCmei = async (data: CmeiFormData): Promise<Cmei> => {
    const payload = {
        ...data,
        capacidade: 0, // Capacidade inicial é 0, será somada pelas turmas
        ocupacao: 0,
    };
    
    const { data: newCmei, error } = await supabase
        .from('cmeis')
        .insert([payload])
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao cadastrar CMEI: ${error.message}`);
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
    // 1. Verificar se há turmas
    const hasTurmas = await checkCmeiHasTurmas(id);
    if (hasTurmas) {
        throw new Error("Não é possível excluir. Este CMEI possui turmas associadas.");
    }
    
    // 2. Verificar se há crianças ativas
    const hasActiveCriancas = await checkCmeiHasActiveCriancas(id);
    if (hasActiveCriancas) {
        throw new Error("Não é possível excluir. Este CMEI possui crianças matriculadas ou convocadas.");
    }
    
    const { error } = await supabase
        .from('cmeis')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Erro ao excluir CMEI: ${error.message}`);
    }
};


// --- Hook Principal ---

const CMEIS_QUERY_KEY = 'cmeis';
const TURMAS_QUERY_KEY = 'turmas';

export const useCMEIs = () => {
    const queryClient = useQueryClient();
    
    const queryResult = useQuery<Cmei[], Error>({
        queryKey: [CMEIS_QUERY_KEY],
        queryFn: fetchCmeis,
    });
    
    const createMutation = useMutation({
        mutationFn: createCmei,
        onSuccess: (newCmei) => {
            queryClient.invalidateQueries({ queryKey: [CMEIS_QUERY_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [CMEIS_QUERY_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [CMEIS_QUERY_KEY] });
            toast.success("CMEI excluído com sucesso!");
        },
        onError: (e) => {
            toast.error("Erro ao excluir CMEI.", {
                description: e.message,
            });
        },
    });

    return {
        ...queryResult,
        cmeis: queryResult.data || [],
        createCmei: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        updateCmei: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        deleteCmei: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
};

export const useTurmasByCmei = (cmeiId: string | undefined) => {
    return useQuery<Turma[], Error>({
        queryKey: [TURMAS_QUERY_KEY, cmeiId],
        queryFn: () => fetchTurmasByCmei(cmeiId!),
        enabled: !!cmeiId,
    });
};