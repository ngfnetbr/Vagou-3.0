import { supabase } from "@/integrations/supabase/client";

// Tipagens Cmei e Turma foram movidas para src/hooks/use-cmeis.ts para evitar conflitos de tipagem.

export const fetchCmeis = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('cmeis')
        .select('id, nome, endereco, latitude, longitude, telefone, email, diretor, coordenador, capacidade, ocupacao, created_at')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro ao buscar CMEIs:", error);
        throw new Error(error.message);
    }
    return data;
};

export const fetchTurmasByCmei = async (cmeiId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('turmas')
        .select('id, cmei_id, nome, sala, capacidade, ocupacao, turma_base_id')
        .eq('cmei_id', cmeiId)
        .order('nome', { ascending: true });

    if (error) {
        console.error(`Erro ao buscar turmas para CMEI ${cmeiId}:`, error);
        throw new Error(error.message);
    }
    return data;
};