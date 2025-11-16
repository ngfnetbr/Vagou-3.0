import { supabase } from "@/integrations/supabase/client";
import { getCriancaById } from "./criancas-api";
import { calculateAgeAtCutoff, determineTurmaBaseName } from "./utils";

export interface TurmaVagaDetalhe {
    cmei: string;
    turma: string;
    vagas: number; // Pode ser negativo se estiver lotado
    capacidade: number;
    ocupacao: number;
    cmei_id: string;
    turma_id: string;
}

/**
 * Busca todas as turmas compatíveis com a idade da criança em um CMEI específico (ou todos),
 * incluindo turmas lotadas. Usado para realocação manual e remanejamento.
 * @param criancaId ID da criança.
 * @param targetCmeiId Opcional. Se fornecido, filtra apenas por este CMEI.
 * @returns Lista de turmas compatíveis.
 */
export const fetchAllCompatibleTurmas = async (criancaId: string, targetCmeiId?: string): Promise<TurmaVagaDetalhe[]> => {
    // 1. Buscar a criança para obter data de nascimento
    const crianca = await getCriancaById(criancaId);
    if (!crianca) return [];

    // 2. Calcular a idade na data de corte e determinar a Turma Base compatível
    const ageAtCutoff = calculateAgeAtCutoff(crianca.data_nascimento);
    const requiredTurmaBaseName = determineTurmaBaseName(ageAtCutoff);
    
    if (requiredTurmaBaseName === "Data de Nascimento Inválida" || requiredTurmaBaseName === "Fora da faixa etária") {
        return [];
    }
    
    // 3. Buscar o ID da Turma Base correspondente
    const { data: baseTurmaData, error: baseTurmaError } = await supabase
        .from('turmas_base')
        .select('id')
        .eq('nome', requiredTurmaBaseName)
        .single();
        
    if (baseTurmaError || !baseTurmaData) {
        console.error(`Turma Base não encontrada para: ${requiredTurmaBaseName}`, baseTurmaError);
        return [];
    }
    
    const requiredTurmaBaseId = baseTurmaData.id;
    
    // 4. Definir filtros de CMEI
    let cmeiFilter = {};
    if (targetCmeiId) {
        cmeiFilter = { cmei_id: targetCmeiId };
    }

    // 5. Buscar todas as turmas que correspondem ao requiredTurmaBaseId e ao filtro de CMEI
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
        .eq('turma_base_id', requiredTurmaBaseId) // Filtra pela Turma Base compatível
        .match(cmeiFilter) // Aplica o filtro de CMEI
        .order('nome', { ascending: true });

    if (turmasError) {
        console.error("Erro ao buscar turmas compatíveis:", turmasError);
        return [];
    }
    
    // 6. Mapear
    return turmasDb.map(t => ({
        cmei: ((t.cmeis as any) as { nome: string }).nome,
        turma: t.nome,
        capacidade: t.capacidade,
        ocupacao: t.ocupacao,
        vagas: t.capacidade - t.ocupacao,
        cmei_id: t.cmei_id,
        turma_id: t.id,
    }));
};