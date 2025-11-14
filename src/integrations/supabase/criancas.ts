import { supabase } from "@/integrations/supabase/client";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";

// --- Tipagem de Dados ---

export interface HistoricoEntry {
  data: string; // YYYY-MM-DD
  acao: string;
  detalhes: string;
  usuario: string;
}

// Tipagem da tabela 'criancas' no Supabase
export interface Crianca {
  id: string; // UUID
  nome: string;
  data_nascimento: string; // YYYY-MM-DD format
  sexo: "feminino" | "masculino";
  programas_sociais: boolean; // Mapeado de 'sim'/'nao' para boolean
  aceita_qualquer_cmei: boolean; // Mapeado de 'sim'/'nao' para boolean
  cmei1_preferencia: string;
  cmei2_preferencia?: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_telefone: string;
  responsavel_email?: string;
  endereco?: string;
  bairro?: string;
  observacoes?: string;
  status: "Matriculada" | "Matriculado" | "Fila de Espera" | "Convocado" | "Desistente" | "Recusada" | "Remanejamento Solicitado";
  cmei_atual_id?: string; // UUID do CMEI atual (se matriculado/convocado)
  turma_atual_id?: string; // UUID da Turma atual (se matriculado/convocado)
  posicao_fila?: number;
  convocacao_deadline?: string; // YYYY-MM-DD for conviction deadline
  created_at: string;
  
  // Campos calculados/relacionados (não vêm diretamente do DB, mas são úteis no frontend)
  idade: string; // Calculado
  cmeiNome?: string; // Nome do CMEI atual
  turmaNome?: string; // Nome da Turma atual
}

// --- Helper Functions ---

// Helper function to calculate age string (years, months, days)
const calculateAgeString = (dobString: string): string => {
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
const mapDbToCrianca = (dbData: any): Crianca => {
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
        
        // Campos calculados
        idade: calculateAgeString(dbData.data_nascimento),
        cmeiNome: dbData.cmeis?.nome, // Assume que o JOIN 'cmeis' está disponível
        turmaNome: dbData.turmas?.nome, // Assume que o JOIN 'turmas' está disponível
    };
};

// Mapeia o formato do Formulário (InscricaoFormData) para o formato do DB
const mapFormToDb = (data: InscricaoFormData) => {
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
    };
};

// Função para obter o email do usuário logado ou 'sistema'
const getLoggedUser = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? user.email || 'usuário desconhecido' : 'sistema';
};

// Função para registrar uma entrada no histórico
const registerHistorico = async (criancaId: string, acao: string, detalhes: string) => {
    const usuario = await getLoggedUser();
    const { error } = await supabase
        .from('historico')
        .insert({
            crianca_id: criancaId,
            acao: acao,
            detalhes: detalhes,
            usuario: usuario,
            data: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        });
        
    if (error) {
        console.error("Erro ao registrar histórico:", error);
        // Não lançamos erro aqui para não interromper a mutação principal
    }
};

// --- Funções de API (Supabase) ---

export const fetchCriancas = async (): Promise<Crianca[]> => {
  const { data, error } = await supabase
    .from('criancas')
    .select(`
        *,
        cmeis (nome),
        turmas (nome)
    `)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  
  return data.map(mapDbToCrianca);
};

export const getCriancaById = async (id: string): Promise<Crianca | undefined> => {
    const { data, error } = await supabase
        .from('criancas')
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
        .eq('id', id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        throw new Error(error.message);
    }
    
    if (!data) return undefined;
    
    return mapDbToCrianca(data);
};

export const addCriancaFromInscricao = async (data: InscricaoFormData): Promise<Crianca> => {
  const payload = mapFormToDb(data);
  
  const { data: newCriancaDb, error } = await supabase
    .from('criancas')
    .insert([payload])
    .select(`
        *,
        cmeis (nome),
        turmas (nome)
    `)
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar criança: ${error.message}`);
  }
  
  const newCrianca = mapDbToCrianca(newCriancaDb);
  await registerHistorico(newCrianca.id, "Inscrição Realizada", `Nova inscrição para ${newCrianca.nome}. Status: Fila de Espera.`);
  
  return newCrianca;
};

export const updateCrianca = async (id: string, data: InscricaoFormData): Promise<Crianca> => {
    const payload = mapFormToDb(data);
    
    // Remove campos de status inicial para não sobrescrever o status atual
    delete payload.status;
    delete payload.cmei_atual_id;
    delete payload.turma_atual_id;
    delete payload.posicao_fila;
    delete payload.convocacao_deadline;

    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update(payload)
        .eq('id', id)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
        .single();

    if (error) {
        throw new Error(`Erro ao atualizar criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Dados Cadastrais Atualizados", `Dados de ${updatedCrianca.nome} atualizados.`);
    
    return updatedCrianca;
};

export const deleteCrianca = async (id: string): Promise<void> => {
    // Buscamos o nome antes de deletar para o histórico
    const crianca = await getCriancaById(id);
    
    const { error } = await supabase
        .from('criancas')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Erro ao excluir criança: ${error.message}`);
    }
    
    if (crianca) {
        await registerHistorico(id, "Criança Excluída", `Registro de ${crianca.nome} excluído permanentemente do sistema.`);
    }
};

// --- Funções de Mutação de Status (Ações Administrativas) ---

export interface ConvocationData {
    cmei_id: string;
    turma_id: string;
}

// Função para calcular o deadline (7 dias úteis)
const calculateDeadline = (): string => {
    const today = new Date();
    let deadline = new Date(today);
    
    // Simulação simples: 7 dias + 2 dias de fim de semana = 9 dias
    deadline.setDate(deadline.getDate() + 9); 
    
    return deadline.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const convocarCrianca = async (criancaId: string, data: ConvocationData): Promise<Crianca> => {
    const deadline = calculateDeadline();
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Convocado",
            cmei_atual_id: data.cmei_id,
            turma_atual_id: data.turma_id,
            posicao_fila: null,
            convocacao_deadline: deadline,
        })
        .eq('id', criancaId)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
        .single();

    if (error) {
        throw new Error(`Erro ao convocar criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Convocação Enviada", `Convocado(a) para ${updatedCrianca.cmeiNome} - ${updatedCrianca.turmaNome}. Prazo até ${deadline}.`);
    
    return updatedCrianca;
};

export const confirmarMatricula = async (criancaId: string): Promise<Crianca> => {
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Matriculado", // Simplificando para 'Matriculado'
            posicao_fila: null,
            convocacao_deadline: null,
        })
        .eq('id', criancaId)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
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
        })
        .eq('id', criancaId)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
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
        })
        .eq('id', criancaId)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
        .single();

    if (error) {
        throw new Error(`Erro ao marcar desistente: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Desistência Registrada", `Criança marcada como desistente. Justificativa: ${justificativa}`);
    
    return updatedCrianca;
};

export const reativarCrianca = async (criancaId: string): Promise<Crianca> => {
    // TODO: Implementar lógica de atribuição de posição no final da fila
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Fila de Espera",
            cmei_atual_id: null,
            turma_atual_id: null,
            convocacao_deadline: null,
            // posicao_fila será atualizado por trigger ou função de fila
        })
        .eq('id', criancaId)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
        .single();

    if (error) {
        throw new Error(`Erro ao reativar criança: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Reativação na Fila", `${updatedCrianca.nome} reativado(a) na fila de espera.`);
    
    return updatedCrianca;
};

export const marcarFimDeFila = async (criancaId: string, justificativa: string): Promise<Crianca> => {
    // TODO: Implementar lógica de atribuição de posição no final da fila
    
    const { data: updatedCriancaDb, error } = await supabase
        .from('criancas')
        .update({
            status: "Fila de Espera",
            cmei_atual_id: null,
            turma_atual_id: null,
            convocacao_deadline: null,
            // posicao_fila será atualizado por trigger ou função de fila
        })
        .eq('id', criancaId)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
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
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
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
        })
        .eq('id', criancaId)
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
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
        .select(`
            *,
            cmeis (nome),
            turmas (nome)
        `)
        .single();

    if (error) {
        throw new Error(`Erro ao solicitar remanejamento: ${error.message}`);
    }
    
    const updatedCrianca = mapDbToCrianca(updatedCriancaDb);
    await registerHistorico(updatedCrianca.id, "Solicitação de Remanejamento", `Remanejamento solicitado. Justificativa: ${justificativa}`);
    
    return updatedCrianca;
};

// --- Funções de Suporte (Vagas Disponíveis) ---

export const fetchAvailableTurmas = async (criancaId: string): Promise<{ cmei: string, turma: string, vagas: number, cmei_id: string, turma_id: string }[]> => {
    // 1. Buscar a criança para obter preferências
    const crianca = await getCriancaById(criancaId);
    if (!crianca) return [];

    // 2. Buscar todas as turmas disponíveis (com JOIN para CMEI e Turma Base)
    const { data: turmasDb, error: turmasError } = await supabase
        .from('turmas')
        .select(`
            id,
            cmei_id,
            capacidade,
            ocupacao,
            nome,
            turma_base_id,
            cmeis (nome),
            turmas_base (idade_minima_meses, idade_maxima_meses)
        `)
        .gt('capacidade', 0); // Filtra apenas turmas com capacidade > 0

    if (turmasError) {
        console.error("Erro ao buscar turmas disponíveis:", turmasError);
        return [];
    }
    
    // 3. Filtrar por compatibilidade de idade (usando data_nascimento da criança)
    const dob = new Date(crianca.data_nascimento + 'T00:00:00');
    const today = new Date();
    const ageInMonths = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());

    let availableTurmas = turmasDb
        .filter(t => t.capacidade > t.ocupacao) // Deve ter vagas
        .filter(t => {
            const base = (t.turmas_base as any) as { idade_minima_meses: number, idade_maxima_meses: number };
            return ageInMonths >= base.idade_minima_meses && ageInMonths <= base.idade_maxima_meses;
        })
        .map(t => ({
            cmei: ((t.cmeis as any) as { nome: string }).nome,
            turma: t.nome,
            vagas: t.capacidade - t.ocupacao,
            cmei_id: t.cmei_id,
            turma_id: t.id,
        }));

    const preferredCmeis = [crianca.cmei1_preferencia, crianca.cmei2_preferencia].filter(Boolean);
    
    if (!crianca.aceita_qualquer_cmei) {
        // Se não aceita qualquer CMEI, filtra apenas os preferidos
        availableTurmas = availableTurmas.filter(turma => preferredCmeis.includes(turma.cmei));
    } else {
        // Prioriza CMEIs preferidos
        availableTurmas.sort((a, b) => {
            const aPreferred = preferredCmeis.includes(a.cmei);
            const bPreferred = preferredCmeis.includes(b.cmei);
            
            if (aPreferred && !bPreferred) return -1;
            if (!aPreferred && bPreferred) return 1;
            return 0;
        });
    }

    return availableTurmas;
};

// Exporta a tipagem ConvocationData (já definida acima)

// Exporta a tipagem para o histórico (se necessário, mas vamos usar a tabela 'historico' real)
export interface HistoricoEntry {
  data: string; // YYYY-MM-DD
  acao: string;
  detalhes: string;
  usuario: string;
}

// Busca o histórico real da criança
export const fetchHistoricoCrianca = async (criancaId: string): Promise<HistoricoEntry[]> => {
    const { data, error } = await supabase
        .from('historico')
        .select('*')
        .eq('crianca_id', criancaId)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Erro ao buscar histórico:", error);
        return [];
    }
    
    // Mapeia a estrutura do DB para HistoricoEntry
    return data.map(h => ({
        data: h.data,
        acao: h.acao,
        detalhes: h.detalhes,
        usuario: h.usuario,
    }));
};