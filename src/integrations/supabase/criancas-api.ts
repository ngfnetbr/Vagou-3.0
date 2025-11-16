import { supabase } from "@/integrations/supabase/client";
import { Crianca, ConvocationData } from "./types";
import { insertHistoricoEntry } from "./historico-api";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { mapFormToDb, mapDbToCrianca } from "./utils";
import { format, parseISO } from "date-fns";

// Helper para obter o nome do usuário logado (ou um placeholder)
const getAdminUser = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || "Usuário Admin";
};

const SELECT_FIELDS = `
    *,
    cmeis (nome),
    turmas (nome)
`;

// --- Funções de Busca ---

export const fetchCriancas = async (): Promise<Crianca[]> => {
  const { data, error } = await supabase
    .from('criancas')
    .select(SELECT_FIELDS)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  
  return data.map(mapDbToCrianca);
};

export const fetchCriancaDetails = async (id: string): Promise<Crianca> => {
    const { data, error } = await supabase
        .from('criancas')
        .select(SELECT_FIELDS)
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    
    return mapDbToCrianca(data);
};

export const getCriancaById = async (id: string): Promise<Crianca | undefined> => {
    const { data, error } = await supabase
        .from('criancas')
        .select(SELECT_FIELDS)
        .eq('id', id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        throw new Error(error.message);
    }
    
    if (!data) return undefined;
    
    return mapDbToCrianca(data);
};

/**
 * Busca crianças ativas (Matriculado/Convocado) em uma turma específica.
 */
export const fetchCriancasByTurmaId = async (turmaId: string): Promise<Crianca[]> => {
    const { data, error } = await supabase
        .from('criancas')
        .select(SELECT_FIELDS)
        .eq('turma_atual_id', turmaId)
        .in('status', ['Matriculado', 'Matriculada', 'Convocado'])
        .order('nome', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    
    return data.map(mapDbToCrianca);
};


// --- Funções de CRUD (Inscrição) ---

export const apiAddCrianca = async (data: InscricaoFormData): Promise<Crianca> => {
    const payload = mapFormToDb(data);
    const user = await getAdminUser();
    
    const { data: newCriancaDb, error } = await supabase
        .from('criancas')
        .insert([payload])
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao cadastrar criança: ${error.message}`);
    }
    
    const newCrianca = mapDbToCrianca(newCriancaDb);
    await insertHistoricoEntry({
        crianca_id: newCrianca.id,
        acao: "Inscrição Realizada",
        detalhes: `Nova inscrição para ${newCrianca.nome}. Status: Fila de Espera.`,
        usuario: user,
    });
    
    return newCrianca;
};

export const apiUpdateCrianca = async (id: string, data: InscricaoFormData): Promise<Crianca> => {
    const payload = mapFormToDb(data);
    const user = await getAdminUser();
    
    // Remove campos de status inicial para não sobrescrever o status atual
    delete payload.status;
    delete payload.cmei_atual_id;
    delete payload.turma_atual_id;
    delete payload.posicao_fila;
    delete payload.convocacao_deadline;
    delete payload.data_penalidade;

    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update(payload)
        .eq('id', id)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao atualizar criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await insertHistoricoEntry({
        crianca_id: updatedCrianca.id,
        acao: "Dados Cadastrais Atualizados",
        detalhes: `Dados de ${updatedCrianca.nome} atualizados.`,
        usuario: user,
    });
    
    return updatedCrianca;
};

// --- Funções de Mutação de Status ---

export const apiConfirmarMatricula = async (criancaId: string, cmeiNome: string, turmaNome: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Matriculado',
            convocacao_deadline: null, // Limpa o prazo
            data_penalidade: null,
        })
        .eq('id', criancaId)
        .select()
        .single();

    if (error) throw new Error(`Falha ao confirmar matrícula: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Matrícula Confirmada",
        detalhes: `Matrícula confirmada no CMEI ${cmeiNome} (Turma: ${turmaNome}).`,
        usuario: user,
    });
};

export const apiConvocarCrianca = async (criancaId: string, data: ConvocationData, cmeiNome: string, turmaNome: string, deadline: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({
            status: "Convocado",
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
            posicao_fila: null,
            convocacao_deadline: deadline,
            data_penalidade: null, // Limpa penalidade ao convocar
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Erro ao convocar criança: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Convocação Enviada",
        detalhes: `Convocado(a) para ${cmeiNome} - ${turmaNome}. Prazo até ${format(parseISO(deadline + 'T00:00:00'), 'dd/MM/yyyy')}.`,
        usuario: user,
    });
};

export const apiMarcarRecusada = async (criancaId: string, justificativa: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Recusada',
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            data_penalidade: null,
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Falha ao marcar como recusada: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Convocação Recusada",
        detalhes: `Convocação recusada. Justificativa: ${justificativa}`,
        usuario: user,
    });
};

export const apiMarcarDesistente = async (criancaId: string, justificativa: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Desistente',
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            posicao_fila: null,
            data_penalidade: null,
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Falha ao marcar como desistente: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Desistência Registrada",
        detalhes: `Criança marcada como Desistente. Justificativa: ${justificativa}`,
        usuario: user,
    });
};

export const apiMarcarFimDeFila = async (criancaId: string, justificativa: string) => {
    const user = await getAdminUser();
    
    // Aplica a data/hora atual na data_penalidade. O trigger de fila usará este timestamp
    // como o novo critério temporal para colocar a criança no final da fila.
    const penalidadeDateString = new Date().toISOString();
    
    const { error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Fila de Espera', // Volta para fila, mas com penalidade temporal
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            data_penalidade: penalidadeDateString, // Aplica a penalidade temporal
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Falha ao marcar fim de fila: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Fim de Fila Aplicado",
        detalhes: `Criança movida para o fim da fila. Justificativa: ${justificativa}`,
        usuario: user,
    });
};

export const apiReativarCrianca = async (criancaId: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Fila de Espera',
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            data_penalidade: null, // Sempre limpa a penalidade na reativação manual
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Falha ao reativar criança: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Reativação na Fila",
        detalhes: `Criança reativada na fila de espera.`,
        usuario: user,
    });
};

export const apiDeleteCrianca = async (criancaId: string, criancaNome: string) => {
    const user = await getAdminUser();
    
    // 1. Verificar se a criança está em status ativo (Fila, Convocado, Matriculado)
    const { data: crianca, error: fetchError } = await supabase
        .from('criancas')
        .select('status')
        .eq('id', criancaId)
        .single();
        
    if (fetchError || !crianca) {
        // Se não encontrar, pode ser que já tenha sido excluída ou o ID esteja errado.
        // Permitimos a exclusão se não for encontrada, mas logamos o erro.
        console.warn(`Tentativa de exclusão de criança não encontrada: ${criancaId}`);
    } else if (['Fila de Espera', 'Convocado', 'Matriculado', 'Matriculada', 'Remanejamento Solicitado'].includes(crianca.status)) {
        throw new Error(`Não é possível excluir. A criança está em status ativo: ${crianca.status}.`);
    }
    
    const { error } = await supabase
        .from('criancas')
        .delete()
        .eq('id', criancaId);

    if (error) throw new Error(`Falha ao excluir criança: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Criança Excluída",
        detalhes: `Registro da criança ${criancaNome} excluído permanentemente do sistema.`,
        usuario: user,
    });
};

export const apiRealocarCrianca = async (criancaId: string, data: ConvocationData, cmeiNome: string, turmaNome: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Erro ao realocar criança: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Realocação de Turma",
        detalhes: `Realocado(a) para ${cmeiNome} - ${turmaNome}.`,
        usuario: user,
    });
};

export const apiTransferirCrianca = async (criancaId: string, justificativa: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({
            status: "Desistente",
            cmei_atual_id: null,
            turma_atual_id: null,
            posicao_fila: null,
            convocacao_deadline: null,
            data_penalidade: null,
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Erro ao transferir criança: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Transferência (Mudança de Cidade)",
        detalhes: `Matrícula encerrada por transferência. Justificativa: ${justificativa}`,
        usuario: user,
    });
};

export const apiSolicitarRemanejamento = async (criancaId: string, justificativa: string) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({
            status: "Remanejamento Solicitado",
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Erro ao solicitar remanejamento: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Solicitação de Remanejamento",
        detalhes: `Remanejamento solicitado. Justificativa: ${justificativa}`,
        usuario: user,
    });
};

// --- NOVAS FUNÇÕES DE AÇÃO EM MASSA ---

export interface MassRealocationData {
    criancaIds: string[];
    cmei_id: string;
    turma_id: string;
    cmeiNome: string;
    turmaNome: string;
}

export const apiMassRealocate = async (data: MassRealocationData) => {
    const user = await getAdminUser();
    
    const { error } = await supabase
        .from('criancas')
        .update({
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
        })
        .in('id', data.criancaIds);

    if (error) {
        throw new Error(`Erro ao realocar crianças em massa: ${error.message}`);
    }
    
    await insertHistoricoEntry({
        crianca_id: 'sistema', // Usamos 'sistema' ou um ID genérico para ações em massa
        acao: "Realocação em Massa",
        detalhes: `Realocação de ${data.criancaIds.length} crianças para ${data.cmeiNome} - ${data.turmaNome}.`,
        usuario: user,
    });
};

export interface MassStatusUpdateData {
    criancaIds: string[];
    status: Crianca['status'];
    justificativa: string;
}

export const apiMassStatusUpdate = async (data: MassStatusUpdateData) => {
    const user = await getAdminUser();
    
    let updatePayload: Partial<Crianca> = {
        status: data.status,
    };
    
    // Limpa campos de vaga/fila se o status for final
    if (['Desistente', 'Recusada', 'Fila de Espera'].includes(data.status)) {
        updatePayload = {
            ...updatePayload,
            cmei_atual_id: null,
            turma_atual_id: null,
            posicao_fila: null,
            convocacao_deadline: null,
            data_penalidade: data.status === 'Fila de Espera' ? new Date().toISOString() : null, // Aplica penalidade se for Fim de Fila
        };
    }

    const { error } = await supabase
        .from('criancas')
        .update(updatePayload)
        .in('id', data.criancaIds);

    if (error) {
        throw new Error(`Erro ao atualizar status em massa: ${error.message}`);
    }
    
    await insertHistoricoEntry({
        crianca_id: 'sistema',
        acao: `Status em Massa: ${data.status}`,
        detalhes: `Status de ${data.criancaIds.length} crianças alterado para ${data.status}. Justificativa: ${data.justificativa}`,
        usuario: user,
    });
};