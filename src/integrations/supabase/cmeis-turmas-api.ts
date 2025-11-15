import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se um CMEI possui turmas associadas.
 * @param cmeiId ID do CMEI.
 * @returns true se houver turmas, false caso contrário.
 */
export const checkCmeiHasTurmas = async (cmeiId: string): Promise<boolean> => {
    const { count, error } = await supabase
        .from('turmas')
        .select('id', { count: 'exact', head: true })
        .eq('cmei_id', cmeiId);

    if (error) {
        console.error("Erro ao verificar turmas do CMEI:", error);
        throw new Error(error.message);
    }
    return (count || 0) > 0;
};

/**
 * Verifica se um CMEI possui crianças matriculadas ou convocadas.
 * @param cmeiId ID do CMEI.
 * @returns true se houver crianças ativas, false caso contrário.
 */
export const checkCmeiHasActiveCriancas = async (cmeiId: string): Promise<boolean> => {
    const { count, error } = await supabase
        .from('criancas')
        .select('id', { count: 'exact', head: true })
        .eq('cmei_atual_id', cmeiId)
        .in('status', ['Matriculado', 'Matriculada', 'Convocado']);

    if (error) {
        console.error("Erro ao verificar crianças ativas do CMEI:", error);
        throw new Error(error.message);
    }
    return (count || 0) > 0;
};

/**
 * Verifica se uma Turma possui crianças matriculadas ou convocadas.
 * @param turmaId ID da Turma.
 * @returns true se houver crianças ativas, false caso contrário.
 */
export const checkTurmaHasActiveCriancas = async (turmaId: string): Promise<boolean> => {
    const { count, error } = await supabase
        .from('criancas')
        .select('id', { count: 'exact', head: true })
        .eq('turma_atual_id', turmaId)
        .in('status', ['Matriculado', 'Matriculada', 'Convocado']);

    if (error) {
        console.error("Erro ao verificar crianças ativas da Turma:", error);
        throw new Error(error.message);
    }
    return (count || 0) > 0;
};