import { supabase } from "@/integrations/supabase/client";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { Crianca, HistoricoEntry } from "./types";
import { format, parseISO, differenceInMonths, differenceInYears, isValid, startOfDay } from "date-fns";

// --- Helper Functions ---

/**
 * Calcula a idade em anos na data de corte (31 de março do ano alvo).
 * @param dobString Data de nascimento no formato YYYY-MM-DD.
 * @param targetYear Opcional. O ano letivo alvo. Se não fornecido, usa o ano atual.
 * @returns Idade em anos na data de corte.
 */
export const calculateAgeAtCutoff = (dobString: string, targetYear?: number): number | null => {
  try {
    const dob = parseISO(dobString + 'T00:00:00');
    if (!isValid(dob)) return null;

    // Define a data de corte: 31 de março do ano alvo
    const year = targetYear || new Date().getFullYear();
    const cutoffDate = startOfDay(new Date(year, 2, 31)); // Mês 2 é Março

    // Se a data de nascimento for posterior à data de corte, a idade é 0.
    if (dob.getTime() > cutoffDate.getTime()) {
        return 0;
    }
    
    // Calcula a idade em anos na data de corte
    return differenceInYears(cutoffDate, dob);
  } catch (e) {
    return null;
  }
};

/**
 * Determina o nome da Turma Base (Infantil 0, 1, 2, 3) com base na idade de corte.
 * @param ageAtCutoff Idade em anos na data de corte.
 * @returns Nome da turma base ou uma mensagem de erro.
 */
export const determineTurmaBaseName = (ageAtCutoff: number | null): string => {
    if (ageAtCutoff === null) return "Data de Nascimento Inválida";
    
    switch (ageAtCutoff) {
        case 0:
            return "Infantil 0";
        case 1:
            return "Infantil 1";
        case 2:
            return "Infantil 2";
        case 3:
            return "Infantil 3";
        default:
            // Se a idade for 4 anos ou mais na data de corte, está fora da faixa etária do CMEI (Pré I/II)
            return "Fora da faixa etária"; 
    }
};

// Helper function to calculate age string (years, months, days) - Mantido como idade atual para exibição
export const calculateAgeString = (dobString: string): string => {
  const today = new Date();
  const dob = new Date(dobString + 'T00:00:00');
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDay();

  if (days < 0) {
    months--;
    // Get the number of days in the previous month
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ano(s)`);
  if (months > 0) parts.push(`${months} meses`);
  if (days > 0 || parts.length === 0) { // Always show days if no years/months, or if days > 0
    parts.push(`${days} dia(s)`);
  }

  if (parts.length === 0) return "Recém-nascido";
  
  // Format: "1 ano(s), 6 meses e 10 dia(s)"
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' e ');
  
  const last = parts.pop();
  return `${parts.join(', ')} e ${last}`;
};

// Mapeia o formato do DB para o formato do Frontend (Crianca)
export const mapDbToCrianca = (dbData: any): Crianca => {
    return {
        id: dbData.id,
        nome: dbData.nome,
        data_nascimento: dbData.data_nascimento,
        sexo: dbData.sexo,
        programas_sociais: dbData.programas_sociais,
        aceita_qualquer_cmei: dbData.aceita_qualquer_cmei,
        cmei1_preferencia: dbData.cmei1_preferencia,
        cmei2_preferencia: dbData.cmei2_preferencia,
        responsavel_nome: dbData.responsavel_nome,
        responsavel_cpf: dbData.responsavel_cpf,
        responsavel_telefone: dbData.responsavel_telefone,
        responsavel_email: dbData.responsavel_email,
        endereco: dbData.endereco,
        bairro: dbData.bairro,
        observacoes: dbData.observacoes,
        status: dbData.status,
        cmei_atual_id: dbData.cmei_atual_id,
        turma_atual_id: dbData.turma_atual_id,
        cmei_remanejamento_id: dbData.cmei_remanejamento_id, // NOVO
        posicao_fila: dbData.posicao_fila,
        convocacao_deadline: dbData.convocacao_deadline,
        created_at: dbData.created_at,
        data_penalidade: dbData.data_penalidade,
        
        // Campos calculados
        idade: calculateAgeString(dbData.data_nascimento),
        cmeiNome: dbData.cmeis?.nome, // Assume que o JOIN 'cmeis' está disponível
        turmaNome: dbData.turmas?.nome, // Assume que o JOIN 'turmas' está disponível
        // cmeiRemanejamentoNome: dbData.cmeis_remanejamento?.nome, // REMOVIDO TEMPORARIAMENTE
        cmeiRemanejamentoNome: undefined, // Define como undefined para evitar erro de acesso
    };
};

// Mapeia o formato do Formulário (InscricaoFormData) para o formato do DB
export const mapFormToDb = (data: InscricaoFormData) => {
    return {
        nome: data.nomeCrianca,
        data_nascimento: data.dataNascimento,
        sexo: data.sexo,
        programas_sociais: data.programasSociais === 'sim',
        aceita_qualquer_cmei: data.aceitaQualquerCmei === 'sim',
        cmei1_preferencia: data.cmei1,
        cmei2_preferencia: data.cmei2 || null,
        responsavel_nome: data.nomeResponsavel,
        responsavel_cpf: data.cpf,
        responsavel_telefone: data.telefone,
        responsavel_email: data.email || null,
        endereco: data.endereco || null,
        bairro: data.bairro || null,
        observacoes: data.observacoes || null,
        
        // Campos de status inicial
        status: "Fila de Espera",
        cmei_atual_id: null,
        turma_atual_id: null,
        cmei_remanejamento_id: null, // NOVO
        posicao_fila: null, // Será gerenciado por uma função de fila ou trigger
        convocacao_deadline: null,
        data_penalidade: null,
    };
};

// Função para obter o email do usuário logado ou 'sistema'
export const getLoggedUser = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? user.email || 'usuário desconhecido' : 'sistema';
};

// Função para registrar uma entrada no histórico
export const registerHistorico = async (criancaId: string, acao: string, detalhes: string) => {
    const usuario = await getLoggedUser();
    const { error } = await supabase
        .from('historico')
        .insert({
            crianca_id: criancaId,
            acao: acao,
            detalhes: detalhes,
            usuario: usuario,
            data: format(new Date(), 'yyyy-MM-dd'), // YYYY-MM-DD
        });
        
    if (error) {
        console.error("Erro ao registrar histórico:", error);
        // Não lançamos erro aqui para não interromper a mutação principal
    }
};