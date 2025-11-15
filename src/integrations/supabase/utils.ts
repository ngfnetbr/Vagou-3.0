import { supabase } from "@/integrations/supabase/client";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { Crianca, HistoricoEntry } from "./types";
import { format } from "date-fns";

// --- Helper Functions ---

// Helper function to calculate age string (years, months, days)
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
        posicao_fila: dbData.posicao_fila,
        convocacao_deadline: dbData.convocacao_deadline,
        created_at: dbData.created_at,
        data_penalidade: dbData.data_penalidade, // Incluindo data_penalidade
        
        // Campos calculados
        idade: calculateAgeString(dbData.data_nascimento),
        cmeiNome: dbData.cmeis?.nome, // Assume que o JOIN 'cmeis' está disponível
        turmaNome: dbData.turmas?.nome, // Assume que o JOIN 'turmas' está disponível
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