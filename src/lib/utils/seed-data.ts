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

// Faixas etárias baseadas em anos completos na data de corte (31/03)
const mockTurmasBase: TurmaBaseFormData[] = [
  // Infantil 0: 0 anos na data de corte (0 a 11 meses na data de corte)
  { nome: "Infantil 0", idade_minima_meses: 0, idade_maxima_meses: 11, descricao: "0 anos na data de corte (31/03)" },
  // Infantil 1: 1 ano na data de corte (12 a 23 meses na data de corte)
  { nome: "Infantil 1", idade_minima_meses: 12, idade_maxima_meses: 23, descricao: "1 ano na data de corte (31/03)" },
  // Infantil 2: 2 anos na data de corte (24 a 35 meses na data de corte)
  { nome: "Infantil 2", idade_minima_meses: 24, idade_maxima_meses: 35, descricao: "2 anos na data de corte (31/03)" },
  // Infantil 3: 3 anos na data de corte (36 a 47 meses na data de corte)
  { nome: "Infantil 3", idade_minima_meses: 36, idade_maxima_meses: 47, descricao: "3 anos na data de corte (31/03)" },
  // Pré I e Pré II (4 e 5 anos na data de corte)
  { nome: "Pré I", idade_minima_meses: 48, idade_maxima_meses: 59, descricao: "4 anos na data de corte (31/03)" },
  { nome: "Pré II", idade_minima_meses: 60, idade_maxima_meses: 71, descricao: "5 anos na data de corte (31/03)" },
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
  // Novos dados para teste de transição
  {
    nomeCrianca: "Igor Matr. I0", dataNascimento: "2024-02-01", sexo: "masculino", programasSociais: "nao", aceitaQualquerCmei: "sim", cmei1: "CMEI Centro", cmei2: "",
    nomeResponsavel: "Pai Igor", cpf: "888.888.888-88", telefone: "(99) 9 8888-8888", telefone2: "", email: "", endereco: "Rua F, 60", bairro: "Centro", observacoes: ""
  },
  {
    nomeCrianca: "Júlia Matr. I1", dataNascimento: "2023-01-01", sexo: "feminino", programasSociais: "sim", aceitaQualquerCmei: "nao", cmei1: "CMEI Norte", cmei2: "CMEI Leste",
    nomeResponsavel: "Mãe Júlia", cpf: "999.999.999-99", telefone: "(99) 9 8888-9999", telefone2: "", email: "julia@exemplo.com", endereco: "Rua G, 70", bairro: "Norte", observacoes: ""
  },
  {
    nomeCrianca: "Kauã Matr. I2", dataNascimento: "2022-01-01", sexo: "masculino", programasSociais: "nao", aceitaQualquerCmei: "sim", cmei1: "CMEI Sul", cmei2: "",
    nomeResponsavel: "Pai Kauã", cpf: "000.000.000-00", telefone: "(99) 9 8888-0000", telefone2: "", email: "", endereco: "Rua H, 80", bairro: "Sul", observacoes: ""
  },
];

// --- Funções de Inserção ---

export async function seedTurmasBase() {
  // Limpa e insere as novas turmas base
  await supabase.from('turmas_base').delete().neq('id', 0);
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
  
  // Cria 2 turmas de cada modelo em cada CMEI (Sala A e Sala B)
  cmeis.forEach(cmei => {
    turmasBase.forEach(base => {
      // Turma Sala A
      turmasToInsert.push({
        cmei_id: cmei.id,
        turma_base_id: base.id,
        nome: `${base.nome} - Sala A`, // Nome sem (Manhã)
        sala: "A",
        capacidade: Math.floor(cmei.capacidade / (turmasBase.length * 2)), // Distribui a capacidade
      });
      // Turma Sala B
      turmasToInsert.push({
        cmei_id: cmei.id,
        turma_base_id: base.id,
        nome: `${base.nome} - Sala B`, // Nome sem (Tarde)
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
  
  // Busca turmas específicas para matricular
  const { data: turmasData } = await supabase.from('turmas').select('id, cmei_id, turma_base_id, nome').limit(5);
  
  if (turmasData && turmasData.length >= 4) {
      // 1. Criança Matriculada (Infantil 0)
      const matriculado1 = mapFormToDb({
        nomeCrianca: "Gabriel Teste Matr. I0", dataNascimento: "2024-01-01", sexo: "masculino", programasSociais: "nao", aceitaQualquerCmei: "sim", cmei1: "CMEI Centro", cmei2: "",
        nomeResponsavel: "Pai Teste 1", cpf: "666.666.666-66", telefone: "(99) 9 8888-6666", telefone2: "", email: "", endereco: "", bairro: "", observacoes: ""
      });
      matriculado1.status = "Matriculado";
      matriculado1.cmei_atual_id = turmasData[0].cmei_id;
      matriculado1.turma_atual_id = turmasData[0].id;
      criancasPayload.push(matriculado1);
      
      // 2. Criança Matriculada (Infantil 2)
      const matriculado2 = mapFormToDb({
        nomeCrianca: "Laura Teste Matr. I2", dataNascimento: "2022-01-01", sexo: "feminino", programasSociais: "sim", aceitaQualquerCmei: "nao", cmei1: "CMEI Norte", cmei2: "",
        nomeResponsavel: "Mãe Teste 2", cpf: "123.456.789-00", telefone: "(99) 9 8888-1234", telefone2: "", email: "", endereco: "", bairro: "", observacoes: ""
      });
      matriculado2.status = "Matriculado";
      matriculado2.cmei_atual_id = turmasData[1].cmei_id;
      matriculado2.turma_atual_id = turmasData[1].id;
      criancasPayload.push(matriculado2);
      
      // 3. Criança Matriculada (Concluinte - 4 anos na data de corte)
      const concluinte = mapFormToDb({
        nomeCrianca: "Pedro Teste Concl.", dataNascimento: "2020-01-01", sexo: "masculino", programasSociais: "nao", aceitaQualquerCmei: "sim", cmei1: "CMEI Sul", cmei2: "",
        nomeResponsavel: "Pai Teste 3", cpf: "987.654.321-00", telefone: "(99) 9 8888-4321", telefone2: "", email: "", endereco: "", bairro: "", observacoes: ""
      });
      concluinte.status = "Matriculado";
      concluinte.cmei_atual_id = turmasData[2].cmei_id;
      concluinte.turma_atual_id = turmasData[2].id;
      criancasPayload.push(concluinte);
      
      // 4. Criança Convocada (Infantil 1)
      const convocado = mapFormToDb({
        nomeCrianca: "Helena Teste Conv. I1", dataNascimento: "2023-08-01", sexo: "feminino", programasSociais: "sim", aceitaQualquerCmei: "nao", cmei1: "CMEI Leste", cmei2: "CMEI Sul",
        nomeResponsavel: "Mãe Teste Conv", cpf: "777.777.777-77", telefone: "(99) 9 8888-7777", telefone2: "", email: "", endereco: "", bairro: "", observacoes: ""
      });
      convocado.status = "Convocado";
      convocado.cmei_atual_id = turmasData[3].cmei_id;
      convocado.turma_atual_id = turmasData[3].id;
      convocado.convocacao_deadline = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      criancasPayload.push(convocado);
  }
  
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