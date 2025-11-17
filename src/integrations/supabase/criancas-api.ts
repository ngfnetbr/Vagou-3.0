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

// Reintroduzindo os JOINs necessários para CMEI e Turma
// Usamos a sintaxe de relacionamento para garantir que a consulta não falhe se cmei_atual_id for NULL.
// Usamos aliases explícitos para evitar conflitos de nome de tabela (cmeis)
const SELECT_FIELDS = `
    *,
    cmei_atual:cmeis!criancas_cmei_atual_id_fkey(nome),
    turma_atual:turmas!criancas_turma_atual_id_fkey(nome),
    cmei_remanejamento:cmeis!criancas_cmei_remanejamento_id_fkey(nome)
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
 * Busca crianças ativas (Matriculado/Convocado/Remanejamento Solicitado) em uma turma específica.
 */
export const fetchCriancasByTurmaId = async (turmaId: string): Promise<Crianca[]> => {
    const { data, error } = await supabase
        .from('criancas')
        .select(SELECT_FIELDS)
        .eq('turma_atual_id', turmaId)
        .in('status', ['Matriculado', 'Matriculada', 'Convocado', 'Remanejamento Solicitado']) // INCLUÍDO AQUI
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
    
    // O trigger AFTER INSERT agora lida com a notificação de nova inscrição.
    
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
    delete payload.cmei_remanejamento_id; // Não atualiza o remanejamento aqui

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
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Matriculado',
            convocacao_deadline: null, // Limpa o prazo
            data_penalidade: null,
            cmei_remanejamento_id: null, // Limpa remanejamento ao matricular
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) throw new Error(`Falha ao confirmar matrícula: ${error.message}`);
    
    // O trigger AFTER UPDATE agora lida com a notificação de matrícula confirmada.
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Matrícula Confirmada",
        detalhes: `Matrícula confirmada no CMEI ${cmeiNome} (Turma: ${turmaNome}).`,
        usuario: user,
    });
};

export const apiConvocarCrianca = async (criancaId: string, data: ConvocationData, cmeiNome: string, turmaNome: string, deadline: string) => {
    const user = await getAdminUser();
    
    // 1. Busca o status atual para determinar o tipo de convocação
    const crianca = await getCriancaById(criancaId);
    const isRemanejamento = crianca?.status === 'Remanejamento Solicitado';
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Convocado",
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
            posicao_fila: null,
            convocacao_deadline: deadline,
            data_penalidade: null, // Limpa penalidade ao convocar
            cmei_remanejamento_id: isRemanejamento ? crianca.cmei_remanejamento_id : null, // Mantém o ID de remanejamento se for remanejamento
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) throw new Error(`Erro ao convocar criança: ${error.message}`);
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    const acao = isRemanejamento ? "Convocação para Remanejamento Enviada" : "Convocação Enviada";
    const detalhes = isRemanejamento 
        ? `Convocado(a) para remanejamento no CMEI ${cmeiNome} - ${turmaNome}. Prazo até ${format(parseISO(deadline + 'T00:00:00'), 'dd/MM/yyyy')}.`
        : `Convocado(a) para ${cmeiNome} - ${turmaNome}. Prazo até ${format(parseISO(deadline + 'T00:00:00'), 'dd/MM/yyyy')}.`;
        
    // O trigger AFTER UPDATE agora lida com a notificação de convocação.
        
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: acao,
        detalhes: detalhes,
        usuario: user,
    });
};

export const apiMarcarRecusada = async (criancaId: string, justificativa: string) => {
    const user = await getAdminUser();
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Recusada',
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            data_penalidade: null,
            cmei_remanejamento_id: null, // Limpa remanejamento
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

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
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Desistente',
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            posicao_fila: null,
            data_penalidade: null,
            cmei_remanejamento_id: null, // Limpa remanejamento
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

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
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Fila de Espera', // Volta para fila, mas com penalidade temporal
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            data_penalidade: penalidadeDateString, // Aplica a penalidade temporal
            cmei_remanejamento_id: null, // Limpa remanejamento
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

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
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({ 
            status: 'Fila de Espera',
            convocacao_deadline: null,
            cmei_atual_id: null,
            turma_atual_id: null,
            data_penalidade: null, // Sempre limpa a penalidade na reativação manual
            cmei_remanejamento_id: null, // Limpa remanejamento
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

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
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
            cmei_remanejamento_id: null, // Limpa remanejamento ao realocar
            status: 'Matriculado', // Garante que o status volte a ser Matriculado se for Remanejamento Solicitado
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

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
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Desistente",
            cmei_atual_id: null,
            turma_atual_id: null,
            posicao_fila: null,
            convocacao_deadline: null,
            data_penalidade: null,
            cmei_remanejamento_id: null, // Limpa remanejamento
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) throw new Error(`Erro ao transferir criança: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Transferência (Mudança de Cidade)",
        detalhes: `Matrícula encerrada por transferência. Justificativa: ${justificativa}`,
        usuario: user,
    });
};

export const apiSolicitarRemanejamento = async (criancaId: string, cmeiId: string, cmeiNome: string, justificativa: string) => {
    const user = await getAdminUser();
    
    // 1. Verifica se a criança está matriculada e obtém os IDs atuais
    const { data: crianca, error: fetchError } = await supabase
        .from('criancas')
        .select('status, cmei_atual_id, turma_atual_id, responsavel_telefone, nome')
        .eq('id', criancaId)
        .single();
        
    if (fetchError || !crianca || !['Matriculado', 'Matriculada', 'Remanejamento Solicitado'].includes(crianca.status)) {
        throw new Error("A solicitação de remanejamento é exclusiva para crianças matriculadas.");
    }
    
    // 2. Atualiza o status e o CMEI de remanejamento, MANTENDO os IDs atuais
    const { error } = await supabase
        .from('criancas')
        .update({
            status: "Remanejamento Solicitado",
            cmei_remanejamento_id: cmeiId, // Define o CMEI desejado
            cmei_atual_id: crianca.cmei_atual_id, // MANTÉM
            turma_atual_id: crianca.turma_atual_id, // MANTÉM
        })
        .eq('id', criancaId);

    if (error) throw new Error(`Erro ao solicitar remanejamento: ${error.message}`);
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Solicitação de Remanejamento",
        detalhes: `Remanejamento solicitado para ${cmeiNome}. Justificativa: ${justificativa}`,
        usuario: user,
    });
};

// --- FUNÇÕES DE AÇÃO EM MASSA ---

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
            cmei_remanejamento_id: null, // Limpa remanejamento ao realocar
            status: 'Matriculado', // Garante que o status volte a ser Matriculado se for Remanejamento Solicitado
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
            cmei_remanejamento_id: null, // Limpa remanejamento
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

// --- NOVO: Função para Reenviar Notificação (Chama Edge Function) ---

const SUPABASE_PROJECT_ID = "bibsduqgpmeuwbsgdoih"; 
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/resend-notification`;

export const apiResendConvocationNotification = async (criancaId: string) => {
    const session = await supabase.auth.getSession();
    const access_token = session.data.session?.access_token;

    if (!access_token) {
        throw new Error("Usuário não autenticado. Não é possível reenviar notificação.");
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({ criancaId }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Falha ao reenviar notificação via Edge Function.");
    }
    
    // O registro no histórico é feito dentro da Edge Function
};