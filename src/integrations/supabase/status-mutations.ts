import { supabase } from "@/integrations/supabase/client";
import { Crianca, ConvocationData } from "./types";
import { mapDbToCrianca, registerHistorico } from "./utils";
import { calculateDeadline } from "./config";
import { format, parseISO } from "date-fns";

const SELECT_FIELDS = `
    *,
    cmeis (nome),
    turmas (nome)
`;

export const convocarCrianca = async (criancaId: string, data: ConvocationData): Promise<Crianca> => {
    const deadline = await calculateDeadline();
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Convocado",
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
            posicao_fila: null,
            convocacao_deadline: deadline,
            data_penalidade: null, // Limpa penalidade ao convocar
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao convocar criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Convocação Enviada", `Convocado(a) para ${updatedCrianca.cmeiNome} - ${updatedCrianca.turmaNome}. Prazo até ${format(parseISO(deadline), 'dd/MM/yyyy')}.`);
    
    return updatedCrianca;
};

export const confirmarMatricula = async (criancaId: string): Promise<Crianca> => {
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Matriculado",
            posicao_fila: null,
            convocacao_deadline: null,
            data_penalidade: null, // Limpa penalidade ao matricular
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao confirmar matrícula: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Matrícula Confirmada", `Matrícula efetivada no CMEI ${updatedCrianca.cmeiNome} - ${updatedCrianca.turmaNome}.`);
    
    return updatedCrianca;
};

export const marcarRecusada = async (criancaId: string, justificativa: string): Promise<Crianca> => {
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Recusada",
            posicao_fila: null,
            convocacao_deadline: null,
            data_penalidade: null, // Limpa penalidade ao marcar como recusada (status final)
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao marcar recusa: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Convocação Recusada", `Recusa de convocação para ${updatedCrianca.cmeiNome}. Justificativa: ${justificativa}`);
    
    return updatedCrianca;
};

export const marcarDesistente = async (criancaId: string, justificativa: string): Promise<Crianca> => {
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Desistente",
            cmei_atual_id: null,
            turma_atual_id: null,
            posicao_fila: null,
            convocacao_deadline: null,
            data_penalidade: null, // Limpa penalidade ao marcar como desistente (status final)
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao marcar desistente: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Desistência Registrada", `Criança marcada como desistente. Justificativa: ${justificativa}`);
    
    return updatedCrianca;
};

export const reativarCrianca = async (criancaId: string): Promise<Crianca> => {
    // A posição na fila será atualizada pelo trigger handle_fila_recalculation
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Fila de Espera",
            cmei_atual_id: null,
            turma_atual_id: null,
            convocacao_deadline: null,
            data_penalidade: null, // Limpa penalidade ao reativar
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao reativar criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Reativação na Fila", `${updatedCrianca.nome} reativado(a) na fila de espera.`);
    
    return updatedCrianca;
};

export const marcarFimDeFila = async (criancaId: string, justificativa: string): Promise<Crianca> => {
    // Aplica a penalidade de data/hora atual para garantir que vá para o final da fila
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Fila de Espera",
            cmei_atual_id: null,
            turma_atual_id: null,
            convocacao_deadline: null,
            data_penalidade: new Date().toISOString(), // Aplica penalidade de tempo
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao marcar fim de fila: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Fim de Fila", `Convocação recusada, ${updatedCrianca.nome} movido(a) para o fim da fila. Justificativa: ${justificativa}`);
    
    return updatedCrianca;
};

export const realocarCrianca = async (criancaId: string, data: ConvocationData): Promise<Crianca> => {
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao realocar criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Realocação de Turma", `Realocado(a) para ${updatedCrianca.cmeiNome} - ${updatedCrianca.turmaNome}.`);
    
    return updatedCrianca;
};

export const transferirCrianca = async (criancaId: string, justificativa: string): Promise<Crianca> => {
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Desistente",
            cmei_atual_id: null,
            turma_atual_id: null,
            posicao_fila: null,
            convocacao_deadline: null,
            data_penalidade: null,
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao transferir criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Transferência (Mudança de Cidade)", `Matrícula encerrada por transferência. Justificativa: ${justificativa}`);
    
    return updatedCrianca;
};

export const solicitarRemanejamento = async (criancaId: string, justificativa: string): Promise<Crianca> => {
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Remanejamento Solicitado",
        })
        .eq('id', criancaId)
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        throw new Error(`Erro ao solicitar remanejamento: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Solicitação de Remanejamento", `Remanejamento solicitado. Justificativa: ${justificativa}`);
    
    return updatedCrianca;
};