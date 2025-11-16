import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";

// --- Tipagem de Dados ---

export interface HistoricoEntry {
  data: string; // YYYY-MM-DD
  acao: string;
  detalhes: string;
  usuario: string;
  created_at: string; // Adicionado para timestamp completo
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
  cmei_remanejamento_id?: string; // NOVO: CMEI desejado para remanejamento
  posicao_fila?: number;
  convocacao_deadline?: string; // YYYY-MM-DD for conviction deadline
  created_at: string;
  data_penalidade?: string; // Novo campo para penalidade de fila
  
  // Campos calculados/relacionados (não vêm diretamente do DB, mas são úteis no frontend)
  idade: string; // Calculado
  cmeiNome?: string; // Nome do CMEI atual
  turmaNome?: string; // Nome da Turma atual
  cmeiRemanejamentoNome?: string; // NOVO: Nome do CMEI de remanejamento
}

export interface ConvocationData {
    cmei_id: string;
    turma_id: string;
}

// Tipagem do payload para o DB (sem campos calculados)
export type CriancaDbPayload = Omit<Crianca, 'idade' | 'cmeiNome' | 'turmaNome' | 'cmeiRemanejamentoNome'>;