import { InscricaoFormData } from "./schemas/inscricao-schema";

export type CriancaStatus = "Matriculado" | "Fila de Espera" | "Convocado" | "Desistente";

export interface HistoricoEntry {
  data: string; // YYYY-MM-DD
  acao: string;
  cmei?: string;
}

export interface Crianca extends InscricaoFormData {
  id: number;
  status: CriancaStatus;
  posicaoFila?: number;
  historico: HistoricoEntry[];
  // Campos de contato e endereço herdados de InscricaoFormData, garantindo que existam
  cpf: string;
  telefone: string;
  telefone2: string;
  email: string;
  endereco: string;
  bairro: string;
}

// Mock Data
const mockCriancas: Crianca[] = [
  {
    id: 1,
    nomeCrianca: "Alice Silva",
    dataNascimento: "2021-05-10",
    sexo: "feminino",
    programasSociais: "sim",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Centro",
    cmei2: "CMEI Norte",
    nomeResponsavel: "Mariana Silva",
    cpf: "123.456.789-00",
    telefone: "(41) 98765-4321",
    telefone2: "(41) 99887-7665",
    email: "mariana@email.com",
    endereco: "Rua das Flores, 100",
    bairro: "Centro",
    observacoes: "Mãe trabalha em período integral.",
    status: "Fila de Espera",
    historico: [
      { data: "2023-10-01", acao: "Inscrição Inicial", cmei: "CMEI Centro" },
    ],
  },
  {
    id: 2,
    nomeCrianca: "Bruno Santos",
    dataNascimento: "2022-01-20",
    sexo: "masculino",
    programasSociais: "nao",
    aceitaQualquerCmei: "sim",
    cmei1: "CMEI Sul",
    cmei2: "",
    nomeResponsavel: "João Santos",
    cpf: "987.654.321-00",
    telefone: "(41) 91234-5678",
    telefone2: "",
    email: "joao@email.com",
    endereco: "Avenida Principal, 50",
    bairro: "Vila Nova",
    observacoes: "",
    status: "Fila de Espera",
    historico: [
      { data: "2023-11-15", acao: "Inscrição Inicial", cmei: "CMEI Sul" },
    ],
  },
  {
    id: 3,
    nomeCrianca: "Carla Oliveira",
    dataNascimento: "2021-11-05",
    sexo: "feminino",
    programasSociais: "sim",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Leste",
    cmei2: "",
    nomeResponsavel: "Fernanda Oliveira",
    cpf: "111.222.333-44",
    telefone: "(41) 95555-4444",
    telefone2: "",
    email: "fernanda@email.com",
    endereco: "Rua da Paz, 30",
    bairro: "Jardim Alegre",
    observacoes: "Família em situação de vulnerabilidade social.",
    status: "Convocado",
    historico: [
      { data: "2023-09-01", acao: "Inscrição Inicial", cmei: "CMEI Leste" },
      { data: "2024-01-10", acao: "Convocação para Matrícula", cmei: "CMEI Leste" },
    ],
  },
  {
    id: 4,
    nomeCrianca: "David Pereira",
    dataNascimento: "2020-08-25",
    sexo: "masculino",
    programasSociais: "nao",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Centro",
    cmei2: "",
    nomeResponsavel: "Roberto Pereira",
    cpf: "555.666.777-88",
    telefone: "(41) 93333-2222",
    telefone2: "",
    email: "roberto@email.com",
    endereco: "Rua Nova, 20",
    bairro: "Centro",
    observacoes: "",
    status: "Matriculado",
    historico: [
      { data: "2022-05-01", acao: "Inscrição Inicial", cmei: "CMEI Centro" },
      { data: "2022-08-15", acao: "Matrícula Efetivada", cmei: "CMEI Centro" },
    ],
  },
  {
    id: 5,
    nomeCrianca: "Eva Rocha",
    dataNascimento: "2023-02-14",
    sexo: "feminino",
    programasSociais: "nao",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Norte",
    cmei2: "",
    nomeResponsavel: "Patrícia Rocha",
    cpf: "444.333.222-11",
    telefone: "(41) 91111-0000",
    telefone2: "",
    email: "patricia@email.com",
    endereco: "Rua do Sol, 5",
    bairro: "Aurora",
    observacoes: "",
    status: "Fila de Espera",
    historico: [
      { data: "2024-01-20", acao: "Inscrição Inicial", cmei: "CMEI Norte" },
    ],
  },
  {
    id: 6,
    nomeCrianca: "Felipe Lima",
    dataNascimento: "2021-09-01",
    sexo: "masculino",
    programasSociais: "sim",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Sul",
    cmei2: "CMEI Leste",
    nomeResponsavel: "Gustavo Lima",
    cpf: "777.888.999-00",
    telefone: "(41) 96666-5555",
    telefone2: "",
    email: "gustavo@email.com",
    endereco: "Rua da Montanha, 12",
    bairro: "Alto",
    observacoes: "Beneficiário do Bolsa Família.",
    status: "Fila de Espera",
    historico: [
      { data: "2023-12-01", acao: "Inscrição Inicial", cmei: "CMEI Sul" },
    ],
  },
  {
    id: 7,
    nomeCrianca: "Gabriela Alves",
    dataNascimento: "2022-03-10",
    sexo: "feminino",
    programasSociais: "nao",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Centro",
    cmei2: "",
    nomeResponsavel: "Helena Alves",
    cpf: "222.333.444-55",
    telefone: "(41) 94444-3333",
    telefone2: "",
    email: "helena@email.com",
    endereco: "Rua do Comércio, 500",
    bairro: "Centro",
    observacoes: "",
    status: "Desistente",
    historico: [
      { data: "2023-05-01", acao: "Inscrição Inicial", cmei: "CMEI Centro" },
      { data: "2023-08-01", acao: "Marcação como Desistente", cmei: "CMEI Centro" },
    ],
  },
];

export const getCriancas = (): Crianca[] => mockCriancas;

export const addCriancaMock = async (data: InscricaoFormData): Promise<Crianca> => {
  // Simula delay de API
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  const newId = mockCriancas.length > 0 ? Math.max(...mockCriancas.map(c => c.id)) + 1 : 1;
  const newCrianca: Crianca = {
    id: newId,
    status: "Fila de Espera",
    historico: [{ data: new Date().toISOString().split('T')[0], acao: "Inscrição Inicial", cmei: data.cmei1 }],
    ...data,
  };
  mockCriancas.push(newCrianca);
  return newCrianca;
};

export const updateCriancaMock = async (id: number, data: InscricaoFormData): Promise<Crianca | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const index = mockCriancas.findIndex(c => c.id === id);
    if (index !== -1) {
        const updatedCrianca = {
            ...mockCriancas[index],
            ...data,
        };
        mockCriancas[index] = updatedCrianca;
        return updatedCrianca;
    }
    return undefined;
};

export const deleteCriancaMock = async (id: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const index = mockCriancas.findIndex(c => c.id === id);
    if (index !== -1) {
        mockCriancas.splice(index, 1);
        return true;
    }
    return false;
};

export const updateCriancaStatusMock = async (id: number, newStatus: CriancaStatus, action: string, cmei: string): Promise<Crianca | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const index = mockCriancas.findIndex(c => c.id === id);
    if (index !== -1) {
        const crianca = mockCriancas[index];
        crianca.status = newStatus;
        crianca.historico.push({ 
            data: new Date().toISOString().split('T')[0], 
            acao: action, 
            cmei: cmei 
        });
        return crianca;
    }
    return undefined;
};