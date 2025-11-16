import { supabase } from "@/integrations/supabase/client";

/**
 * Busca todas as turmas que possuem vagas disponíveis, sem filtro de idade.
 * Usado para realocação e transição em massa.
 * @returns Lista de turmas com vagas.
 */
export const fetchAllTurmasWithVagas = async (): Promise<{ cmei: string, turma: string, vagas: number, cmei_id: string, turma_id: string }[]> => {
    
    const { data: turmasDb, error: turmasError } = await supabase
        .from('turmas')
        .select(`
            id,
            cmei_id,
            capacidade,
            ocupacao,
            nome,
            cmeis (nome)
        `)
        .gt('capacidade', 0); // Filtra apenas turmas com capacidade > 0

    if (turmasError) {
        console.error("Erro ao buscar todas as turmas disponíveis:", turmasError);
        throw new Error(turmasError.message);
    }
    
    // Mapear e filtrar por vagas disponíveis
    let availableTurmas = turmasDb
        .filter(t => t.capacidade > t.ocupacao) // Deve ter vagas
        .map(t => ({
            cmei: ((t.cmeis as any) as { nome: string }).nome,
            turma: t.nome,
            vagas: t.capacidade - t.ocupacao,
            cmei_id: t.cmei_id,
            turma_id: t.id,
        }));

    // Ordenação simples por CMEI e Turma
    availableTurmas.sort((a, b) => {
        if (a.cmei < b.cmei) return -1;
        if (a.cmei > b.cmei) return 1;
        if (a.turma < b.turma) return -1;
        if (a.turma > b.turma) return 1;
        return 0;
    });

    return availableTurmas;
};