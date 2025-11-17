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

// --- NOVO: Função para invocar a Edge Function de WhatsApp ---
const invokeWhatsappFunction = async (phone: string, message: string, action: string) => {
    // 1. Validação no cliente antes de invocar
    if (!phone || !message) {
        console.warn(`[WhatsApp] Skipping invocation for action '${action}': Phone or message is empty.`);
        return false;
    }
    
    // DEBUG: Log the phone number and message length before sending
    console.log(`[WhatsApp Client Debug] Sending to EF. Original Phone: ${phone}, Message Length: ${message.length}, Action: ${action}`);
    
    try {
        // Usamos fetch diretamente para ter controle total sobre a resposta de erro
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session?.access_token) {
            throw new Error("Sessão de usuário não encontrada para invocar a função.");
        }
        
        const response = await fetch(`https://bibsduqgpmeuwbsgdoih.supabase.co/functions/v1/send-whatsapp-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.session.access_token}`,
            },
            body: JSON.stringify({ phone: phone, message }),
        });

        const result = await response.json();

        if (!response.ok) {
            let errorMessage = `Edge Function returned status ${response.status}.`;
            
            if (result && result.error) {
                errorMessage = result.error;
                if (result.debug_phone) {
                    errorMessage += ` (Debug: Phone=${result.debug_phone}, MsgLen=${result.debug_message_length})`;
                }
            }
            
            throw new Error(`Falha no envio de notificação WhatsApp: ${errorMessage}`);
        }
        
        if (result && result.error) {
            console.error(`Erro do Z-API (${action}):`, result.error);
            throw new Error(`Erro do Z-API: ${result.error.details?.message || result.error}`);
        }
        
        console.log(`WhatsApp enviado com sucesso (${action}):`, result);
        return true;

    } catch (e) {
        console.error(`Erro ao invocar função WhatsApp (${action}):`, e);
        // Se for um erro de rede ou parsing, lançamos o erro original
        if (e instanceof Error) {
            throw e;
        }
        // Se for um erro de Edge Function que conseguimos detalhar, ele já foi lançado acima.
        return false;
    }
};

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
    
    // --- AÇÃO DE WHATSAPP: INSCRIÇÃO ---
    if (newCrianca.responsavel_telefone) {
        const message = `Olá, ${newCrianca.responsavel_nome}! Sua inscrição para a criança ${newCrianca.nome} na fila de espera do VAGOU foi confirmada. Status atual: Fila de Espera. Você será notificado(a) por este canal quando houver uma convocação.`;
        await invokeWhatsappFunction(newCrianca.responsavel_telefone, message, "Inscrição");
    }
    // -----------------------------------
    
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
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    // --- AÇÃO DE WHATSAPP: MATRÍCULA CONFIRMADA ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `Parabéns, ${updatedCrianca.responsavel_nome}! A matrícula de ${updatedCrianca.nome} foi confirmada com sucesso no CMEI ${cmeiNome} (Turma: ${turmaNome}).`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Matrícula Confirmada");
    }
    // -----------------------------------
    
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
        
    // --- AÇÃO DE WHATSAPP: CONVOCAÇÃO ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `*CONVOCAÇÃO URGENTE* - Olá, ${updatedCrianca.responsavel_nome}! A criança ${updatedCrianca.nome} foi convocada para uma vaga no CMEI ${cmeiNome} (Turma: ${turmaNome}). O prazo para resposta é até ${format(parseISO(deadline + 'T00:00:00'), 'dd/MM/yyyy')}. Acesse o sistema para confirmar.`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Convocação");
    }
    // -----------------------------------
        
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
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    // --- AÇÃO DE WHATSAPP: RECUSA ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `A convocação de ${updatedCrianca.nome} para o CMEI ${updatedCrianca.cmeiNome} foi marcada como recusada. A criança foi removida da fila. Justificativa: ${justificativa}`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Recusa");
    }
    // -----------------------------------
    
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
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    // --- AÇÃO DE WHATSAPP: DESISTÊNCIA ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `A matrícula/inscrição de ${updatedCrianca.nome} foi marcada como Desistente. Justificativa: ${justificativa}`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Desistência");
    }
    // -----------------------------------
    
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
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    // --- AÇÃO DE WHATSAPP: FIM DE FILA ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `A convocação de ${updatedCrianca.nome} foi recusada e a criança foi movida para o fim da fila de espera. Justificativa: ${justificativa}`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Fim de Fila");
    }
    // -----------------------------------
    
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
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    // --- AÇÃO DE WHATSAPP: REATIVAÇÃO ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `A criança ${updatedCrianca.nome} foi reativada na fila de espera do VAGOU.`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Reativação");
    }
    // -----------------------------------
    
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
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    // --- AÇÃO DE WHATSAPP: REALOCAÇÃO ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `A criança ${updatedCrianca.nome} foi realocada para a turma ${turmaNome} no CMEI ${cmeiNome}.`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Realocação");
    }
    // -----------------------------------
    
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
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    
    // --- AÇÃO DE WHATSAPP: TRANSFERÊNCIA ---
    if (updatedCrianca.responsavel_telefone) {
        const message = `A matrícula de ${updatedCrianca.nome} foi encerrada por transferência (mudança de cidade). Justificativa: ${justificativa}`;
        await invokeWhatsappFunction(updatedCrianca.responsavel_telefone, message, "Transferência");
    }
    // -----------------------------------
    
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
    
    // --- AÇÃO DE WHATSAPP: SOLICITAÇÃO DE REMANEJAMENTO ---
    if (crianca.responsavel_telefone) {
        const message = `A solicitação de remanejamento para a criança ${crianca.nome} para o CMEI ${cmeiNome} foi registrada com sucesso. Status: Remanejamento Solicitado.`;
        await invokeWhatsappFunction(crianca.responsavel_telefone, message, "Solicitação de Remanejamento");
    }
    // -----------------------------------
    
    await insertHistoricoEntry({
        crianca_id: criancaId,
        acao: "Solicitação de Remanejamento",
        detalhes: `Remanejamento solicitado para ${cmeiNome}. Justificativa: ${justificativa}`,
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
            cmei_remanejamento_id: null, // Limpa remanejamento ao realocar
            status: 'Matriculado', // Garante que o status volte a ser Matriculado se for Remanejamento Solicitado
        })
        .in('id', data.criancaIds);

    if (error) {
        throw new Error(`Erro ao realocar crianças em massa: ${error.message}`);
    }
    
    // Não enviamos WhatsApp individualmente para ações em massa, apenas um log geral
    
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
    
    // Não enviamos WhatsApp individualmente para ações em massa, apenas um log geral
    
    await insertHistoricoEntry({
        crianca_id: 'sistema',
        acao: `Status em Massa: ${data.status}`,
        detalhes: `Status de ${data.criancaIds.length} crianças alterado para ${data.status}. Justificativa: ${data.justificativa}`,
        usuario: user,
    });
};

// --- NOVO: Função para Reenviar Notificação (WhatsApp) ---

export const apiResendConvocationNotification = async (criancaId: string) => {
    const user = await getAdminUser();
    
    const crianca = await getCriancaById(criancaId);
    
    if (!crianca) {
        throw new Error("Criança não encontrada.");
    }
    
    if (crianca.status !== 'Convocado' || !crianca.convocacao_deadline || !crianca.cmeiNome || !crianca.turmaNome) {
        throw new Error("A criança não está em status de convocação ativa.");
    }
    
    // 1. Validação explícita do telefone
    if (!crianca.responsavel_telefone) {
        throw new Error("Telefone do responsável não cadastrado ou inválido para envio de WhatsApp.");
    }
    
    const deadline = crianca.convocacao_deadline;
    const cmeiNome = crianca.cmeiNome;
    const turmaNome = crianca.turmaNome;
    
    // --- AÇÃO DE WHATSAPP: REENVIO DE CONVOCAÇÃO ---
    const message = `*REENVIO DE CONVOCAÇÃO* - Olá, ${crianca.responsavel_nome}! Reenviamos a notificação de convocação para ${crianca.nome} no CMEI ${cmeiNome} (Turma: ${turmaNome}). O prazo para resposta é até ${format(parseISO(deadline + 'T00:00:00'), 'dd/MM/yyyy')}. Por favor, responda o mais breve possível.`;
    const success = await invokeWhatsappFunction(crianca.responsavel_telefone, message, "Reenvio de Convocação");
    // -----------------------------------
    
    if (success) {
        await insertHistoricoEntry({
            crianca_id: criancaId,
            acao: "Notificação Reenviada (WhatsApp)",
            detalhes: `Notificação de convocação reenviada para ${crianca.responsavel_telefone}.`,
            usuario: user,
        });
    } else {
        // Se invokeWhatsappFunction retornar false, significa que houve um erro na Edge Function
        // O erro detalhado já foi lançado dentro de invokeWhatsappFunction, mas se for um erro genérico, lançamos este:
        throw new Error("Falha ao reenviar notificação via WhatsApp.");
    }
};