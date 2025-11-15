import { supabase } from "@/integrations/supabase/client";
import { TurmaBaseFormData } from "@/hooks/use-turmas-base";
import { CmeiSeedData } from "@/hooks/use-cmeis"; // Importando o novo tipo
import { TurmaFormData } from "@/hooks/use-turmas";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { mapFormToDb } from "@/integrations/supabase/utils";
import { format, addDays } from "date-fns"; // Importando addDays

// --- Dados Fictícios ---

const mockCmeis: CmeiSeedData[] = [ // Usando CmeiSeedData
  { nome: "CMEI Centro", endereco: "Rua Principal, 100", capacidade: 100, diretor: "Maria Silva", coordenador: "João Santos", email: "centro@cmei.com", telefone: "(99) 9 9999-0001", latitude: "-23.5505", longitude: "-46.6333" },
  { nome: "CMEI Norte", endereco: "Av. Norte, 500", capacidade: 120, diretor: "Ana Costa", coordenador: "Pedro Lima", email: "norte@cmei.com", telefone: "(99) 9 9999-0002", latitude: "-23.5000", longitude: "-46.6000" },
  { nome: "CMEI Sul", endereco: "Rua do Sul, 200", capacidade: 80, diretor: "Carla Rocha", coordenador: "Lucas Mendes", email: "sul@cmei.com", telefone: "(99) 9 9999-0003", latitude: "-23.6000", longitude: "-46.7000" },
  { nome: "CMEI Leste", endereco: "Estrada Leste, 300", capacidade: 150, diretor: "Bruno Alves", coordenador: "Fernanda Dias", email: "leste@cmei.com", telefone: "(99) 9 9999-0004", latitude: "-23.5500", longitude: "-46.5500" },
];

const mockTurmasBase: TurmaBaseFormData[] = [
  { nome: "Berçário I", idade_minima_meses: 0, idade_maxima_meses: 11, descricao: "0 a 11 meses" },
  { nome: "Berçário II", idade_minima_meses: 12, idade_maxima_meses: 23, descricao: "1 a 1 ano e 11 meses" },
  { nome: "Maternal I", idade_minima_meses: 24, idade_maxima_meses: 35, descricao: "2 a 2 anos e 11 meses" },
  { nome: "Maternal II", idade_minima_meses: 36, idade_maxima_meses: 47, descricao: "3 a 3 anos e 11 meses" },
  { nome: "Pré I", idade_minima_meses: 48, idade_maxima_meses: 59, descricao: "4 a 4 anos e 11 meses" },
  { nome: "Pré II", idade_minima_meses: 60, idade_maxima_meses: 71, descricao: "5 a 5 anos e 11 meses" },
];

const mockCriancas: InscricaoFormData[] = [
  {
    nomeCrianca: "Alice Souza", dataNascimento: "2024-01-15", sexo: "feminino", programasSociais: "sim", aceitaQualquerCmei: "nao", cmei1: "CMEI Centro", cmei2: "CMEI Norte",
    nomeResponsavel: "Roberta Souza", cpf: "111.111.111-11", telefone: "(99) 9 8888-1111", telefone2: "", email: "roberta@exemplo.com", endereco: "Rua A, 10", bairro: "Centro", observacoes: ""
  },
  {
    nomeCrianca: "Bernardo Lima", dataNascimento: "2023-05-20", sexo: "masculino", programasSociais: "nao", aceitaQualquerCmei: "sim", cmei1: "CMEI Sul", cmei2: "",
    nomeResponsavel: "Carlos Lima", cpf: "222.222.222-22", telefone: "(99) 9 8888-2222", telefone2: "", email: "", endereco: "Rua B, 20", bairro: "Sul", observacoes: ""
  },
  {
    nomeCrianca: "Cecília Pereira", dataNascimento: "2022-10-01", sexo: "feminino", programasSociais: "sim", aceitaQualquerCmei: "nao", cmei1: "CMEI Leste", cmei2: "CMEI Centro",
    nomeResponsavel: "Diana Pereira", cpf: "333.333.333-33", telefone: "(99) 9 8888-3333", telefone2: "", email: "diana@exemplo.com", endereco: "Rua C, 30", bairro: "Leste", observacoes: ""
  },
  {
    nomeCrianca: "Davi Santos", dataNascimento: "2024-03-10", sexo: "masculino", programasSociais: "nao", aceitaQualquerCmei: "sim", cmei1: "CMEI Norte", cmei2: "",
    nomeResponsavel: "Eduardo Santos", cpf: "444.444.444-44", telefone: "(99) 9 8888-4444", telefone2: "", email: "", endereco: "Rua D, 40", bairro: "Norte", observacoes: ""
  },
  {
    nomeCrianca: "Eloá Ferreira", dataNascimento: "2023-01-05", sexo: "feminino", programasSociais: "sim", aceitaQualquerCmei: "nao", cmei1: "CMEI Centro", cmei2: "CMEI Sul",
    nomeResponsavel: "Fábio Ferreira", cpf: "555.555.555-55", telefone: "(99) 9 8888-5555", telefone2: "", email: "fabio@exemplo.com", endereco: "Rua E, 50", bairro: "Centro", observacoes: ""
  },
];

// --- Funções de Inserção ---

export async function seedTurmasBase() {
  const { error } = await supabase.from('turmas_base').insert(mockTurmasBase).select();
  if (error) throw new Error(`Erro ao inserir Turmas Base: ${error.message}`);
  
  // Retorna os dados inseridos para uso posterior
  const { data: turmasBaseData } = await supabase.from('turmas_base').select('*');
  return turmasBaseData;
}

export async function seedCmeis() {
  // Remove capacidade e ocupacao do mock, pois o DB as inicializa
  const cmeisPayload = mockCmeis.map(c => ({
    nome: c.nome,
    endereco: c.endereco,
    diretor: c.diretor,
    coordenador: c.coordenador,
    email: c.email,
    telefone: c.telefone,
    latitude: c.latitude,
    longitude: c.longitude,
    capacidade: c.capacidade, // Mantemos capacidade para o seed
    ocupacao: 0,
  }));
  
  const { error } = await supabase.from('cmeis').insert(cmeisPayload).select();
  if (error) throw new Error(`Erro ao inserir CMEIs: ${error.message}`);
  
  // Retorna os dados inseridos para uso posterior
  const { data: cmeisData } = await supabase.from('cmeis').select('*');
  return cmeisData;
}

export async function seedTurmas(cmeis: any[], turmasBase: any[]) {
  const turmasToInsert: TurmaFormData[] = [];
  
  // Cria 2 turmas de cada modelo em cada CMEI (Manhã e Tarde)
  cmeis.forEach(cmei => {
    turmasBase.forEach(base => {
      // Turma Manhã - Sala A
      turmasToInsert.push({
        cmei_id: cmei.id,
        turma_base_id: base.id,
        nome: `${base.nome} - Sala A (Manhã)`,
        sala: "A",
        capacidade: Math.floor(cmei.capacidade / (turmasBase.length * 2)), // Distribui a capacidade
      });
      // Turma Tarde - Sala B
      turmasToInsert.push({
        cmei_id: cmei.id,
        turma_base_id: base.id,
        nome: `${base.nome} - Sala B (Tarde)`,
        sala: "B",
        capacidade: Math.floor(cmei.capacidade / (turmasBase.length * 2)),
      });
    });
  });
  
  const { error } = await supabase.from('turmas').insert(turmasToInsert).select();
  if (error) throw new Error(`Erro ao inserir Turmas: ${error.message}`);
}

export async function seedCriancas() {
  const criancasPayload = mockCriancas.map(c => mapFormToDb(c));
  
  // Adiciona uma criança matriculada para teste
  const matriculadoPayload = mapFormToDb({
    nomeCrianca: "Gabriel Teste Matr.", dataNascimento: "2022-01-01", sexo: "masculino", programasSociais: "nao", aceitaQualquerCmei: "sim", cmei1: "CMEI Centro", cmei2: "",
    nomeResponsavel: "Pai Teste", cpf: "666.666.666-66", telefone: "(99) 9 8888-6666", telefone2: "", email: "", endereco: "", bairro: "", observacoes: ""
  });
  
  // Busca uma turma para matricular
  const { data: turmaData } = await supabase.from('turmas').select('id, cmei_id').limit(1).single();
  
  if (turmaData) {
      matriculadoPayload.status = "Matriculado";
      matriculadoPayload.cmei_atual_id = turmaData.cmei_id;
      matriculadoPayload.turma_atual_id = turmaData.id;
  }
  
  // Adiciona uma criança convocada para teste
  const convocadoPayload = mapFormToDb({
    nomeCrianca: "Helena Teste Conv.", dataNascimento: "2023-08-01", sexo: "feminino", programasSociais: "sim", aceitaQualquerCmei: "nao", cmei1: "CMEI Norte", cmei2: "CMEI Sul",
    nomeResponsavel: "Mãe Teste", cpf: "777.777.777-77", telefone: "(99) 9 8888-7777", telefone2: "", email: "", endereco: "", bairro: "", observacoes: ""
  });
  
  if (turmaData) {
      convocadoPayload.status = "Convocado";
      convocadoPayload.cmei_atual_id = turmaData.cmei_id;
      convocadoPayload.turma_atual_id = turmaData.id;
      // Define um prazo de convocação para amanhã
      convocadoPayload.convocacao_deadline = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  }
  
  criancasPayload.push(matriculadoPayload);
  criancasPayload.push(convocadoPayload);

  const { error } = await supabase.from('criancas').insert(criancasPayload).select();
  if (error) throw new Error(`Erro ao inserir Crianças: ${error.message}`);
}

export async function clearAllData() {
    // Ordem de exclusão é importante devido às chaves estrangeiras
    await supabase.from('historico').delete().neq('id', 0); // Limpa histórico
    await supabase.from('criancas').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Limpa crianças
    await supabase.from('turmas').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Limpa turmas
    await supabase.from('cmeis').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Limpa cmeis
    await supabase.from('turmas_base').delete().neq('id', 0); // Limpa turmas base
}

export async function runSeed() {
    await clearAllData();
    
    const turmasBase = await seedTurmasBase();
    const cmeis = await seedCmeis();
    await seedTurmas(cmeis, turmasBase);
    await seedCriancas();
}