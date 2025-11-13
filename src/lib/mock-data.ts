export interface HistoricoEntry {
  data: string; // YYYY-MM-DD
  acao: string;
  detalhes: string;
  usuario: string;
}

export interface Crianca {
  id: number;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD format
  idade: string; // Calculated field for display (e.g., 1 ano, 6 meses e 10 dias)
  responsavel: string;
  cpfResponsavel: string;
  telefoneResponsavel: string;
  emailResponsavel?: string;
  endereco?: string;
  bairro?: string;
  sexo: "feminino" | "masculino";
  programasSociais: "sim" | "nao";
  aceitaQualquerCmei: "sim" | "nao";
  cmei1: string;
  cmei2?: string;
  observacoes?: string;
  status: "Matriculada" | "Matriculado" | "Fila de Espera" | "Convocado" | "Desistente" | "Recusada"; // Added Recusada
  cmei: string; // CMEI atual ou preferencial
  turmaAtual?: string; // Nova informação: Turma atual (se matriculado)
  posicaoFila?: number; // Nova informação: Posição na fila (se na fila)
  convocacaoDeadline?: string; // New field: YYYY-MM-DD for conviction deadline
  historico: HistoricoEntry[];
}

let mockCriancas: Crianca[] = [
  {
    id: 1,
    nome: "Ana Silva Santos",
    dataNascimento: "2023-03-15",
    idade: "", // Será calculado
    responsavel: "Maria Silva",
    cpfResponsavel: "111.111.111-11",
    telefoneResponsavel: "(44) 9 1111-1111",
    sexo: "feminino",
    programasSociais: "nao",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Centro",
    cmei2: "CMEI Norte",
    status: "Matriculada",
    cmei: "CMEI Centro",
    turmaAtual: "Berçário I - Sala A", // Adicionado
    historico: [
      { data: "2024-01-20", acao: "Matrícula Efetivada", detalhes: "Matriculada no Berçário I - Sala A", usuario: "Gestor Centro" },
      { data: "2024-01-10", acao: "Convocação Aceita", detalhes: "Convocação para CMEI Centro aceita", usuario: "Sistema" },
      { data: "2023-12-01", acao: "Inscrição Inicial", detalhes: "Inscrição na fila de espera", usuario: "Responsável" },
    ]
  },
  {
    id: 2,
    nome: "João Pedro Costa",
    dataNascimento: "2023-05-22",
    idade: "", // Será calculado
    responsavel: "Pedro Costa",
    cpfResponsavel: "222.222.222-22",
    telefoneResponsavel: "(44) 9 2222-2222",
    sexo: "masculino",
    programasSociais: "sim",
    aceitaQualquerCmei: "sim",
    cmei1: "CMEI Norte",
    status: "Matriculado",
    cmei: "CMEI Norte",
    turmaAtual: "Maternal I - Sala B", // Adicionado
    historico: [
      { data: "2024-02-01", acao: "Matrícula Efetivada", detalhes: "Matriculado no Maternal I - Sala B", usuario: "Gestor Norte" },
      { data: "2024-01-25", acao: "Convocação Aceita", detalhes: "Convocação para CMEI Norte aceita", usuario: "Sistema" },
      { data: "2023-11-15", acao: "Inscrição Inicial", detalhes: "Inscrição na fila de espera (Prioridade Social)", usuario: "Responsável" },
    ]
  },
  {
    id: 3,
    nome: "Carlos Eduardo Silva",
    dataNascimento: "2023-07-08",
    idade: "", // Será calculado
    responsavel: "Eduardo Silva",
    cpfResponsavel: "333.333.333-33",
    telefoneResponsavel: "(44) 9 3333-3333",
    sexo: "masculino",
    programasSociais: "nao",
    aceitaQualquerCmei: "nao",
    cmei1: "CMEI Sul",
    status: "Fila de Espera",
    cmei: "N/A",
    posicaoFila: 15, // Adicionado
    historico: [
      { data: "2024-03-01", acao: "Inscrição Inicial", detalhes: "Inscrição na fila de espera", usuario: "Responsável" },
    ]
  },
  {
    id: 4,
    nome: "Mariana Costa Santos",
    dataNascimento: "2023-04-30",
    idade: "", // Será calculado
    responsavel: "Ana Costa",
    cpfResponsavel: "444.444.444-44",
    telefoneResponsavel: "(44) 9 4444-4444",
    sexo: "feminino",
    programasSociais: "sim",
    aceitaQualquerCmei: "sim",
    cmei1: "CMEI Leste",
    status: "Convocado",
    cmei: "CMEI Leste",
    convocacaoDeadline: "2025-01-20", // Mocked deadline
    historico: [
      { data: "2024-04-10", acao: "Convocação Enviada", detalhes: "Convocação para CMEI Leste", usuario: "Sistema" },
      { data: "2024-03-20", acao: "Inscrição Inicial", detalhes: "Inscrição na fila de espera (Prioridade Social)", usuario: "Responsável" },
    ]
  },
];

// Helper function to calculate age string (years, months, days)
const calculateAgeString = (dobString: string): string => {
  const today = new Date();
  const dob = new Date(dobString + 'T00:00:00');
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

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


// Utility functions to simulate API
export const fetchCriancas = async (): Promise<Crianca[]> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  // Recalculate age on fetch for dynamic display
  return mockCriancas.map(c => ({
    ...c,
    idade: calculateAgeString(c.dataNascimento)
  }));
};

// Type for data coming from the Inscricao form (which is used for new children)
export interface InscricaoFormData {
  nomeCrianca: string;
  dataNascimento: string; // YYYY-MM-DD
  sexo: "feminino" | "masculino";
  programasSociais: "sim" | "nao";
  aceitaQualquerCmei: "sim" | "nao";
  cmei1: string;
  cmei2?: string;
  nomeResponsavel: string;
  cpf: string;
  telefone: string;
  telefone2?: string;
  email?: string;
  endereco?: string;
  bairro?: string;
  observacoes?: string;
}

// Helper to map InscricaoFormData to Crianca structure
const mapInscricaoToCrianca = (data: InscricaoFormData, id: number, currentCmei: string, currentStatus: Crianca['status'], existingCrianca?: Crianca): Crianca => {
    return {
        id: id,
        nome: data.nomeCrianca,
        dataNascimento: data.dataNascimento,
        idade: calculateAgeString(data.dataNascimento),
        responsavel: data.nomeResponsavel,
        cpfResponsavel: data.cpf,
        telefoneResponsavel: data.telefone,
        emailResponsavel: data.email,
        endereco: data.endereco,
        bairro: data.bairro,
        sexo: data.sexo,
        programasSociais: data.programasSociais,
        aceitaQualquerCmei: data.aceitaQualquerCmei,
        cmei1: data.cmei1,
        cmei2: data.cmei2,
        observacoes: data.observacoes,
        status: currentStatus,
        cmei: currentCmei,
        // Preserve existing status-related fields if editing
        turmaAtual: existingCrianca?.turmaAtual,
        posicaoFila: existingCrianca?.posicaoFila,
        convocacaoDeadline: existingCrianca?.convocacaoDeadline,
        historico: [{
            data: new Date().toISOString().split('T')[0],
            acao: id ? "Dados Atualizados" : "Inscrição Inicial",
            detalhes: id ? "Dados cadastrais atualizados via painel administrativo." : "Inscrição na fila de espera via painel administrativo.",
            usuario: "Admin/Gestor",
        }],
    };
};


export const addCriancaFromInscricao = async (data: InscricaoFormData): Promise<Crianca> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newId = mockCriancas.length > 0 ? Math.max(...mockCriancas.map(c => c.id)) + 1 : 1;
  
  const initialStatus: Crianca['status'] = "Fila de Espera";
  const initialCmei = "N/A";
  
  // Simula a atribuição de posição na fila para novos cadastros
  const newPosicaoFila = mockCriancas.filter(c => c.status === "Fila de Espera").length + 1;
  
  const newCrianca = mapInscricaoToCrianca(data, newId, initialCmei, initialStatus);
  newCrianca.posicaoFila = newPosicaoFila;
  
  mockCriancas.push(newCrianca);
  return newCrianca;
};

export const updateCrianca = async (id: number, data: InscricaoFormData): Promise<Crianca> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockCriancas.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Criança não encontrada");

    const existingCrianca = mockCriancas[index];
    
    // Preserve status, current CMEI, turmaAtual and posicaoFila
    const updatedCrianca = mapInscricaoToCrianca(data, id, existingCrianca.cmei, existingCrianca.status, existingCrianca);
    
    // Merge new data with existing history (keeping existing history and adding the update log)
    updatedCrianca.historico = [...existingCrianca.historico, ...updatedCrianca.historico];

    mockCriancas[index] = updatedCrianca;
    return updatedCrianca;
};

export const deleteCrianca = async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    mockCriancas = mockCriancas.filter(c => c.id !== id);
};

export const getCriancaById = (id: number): Crianca | undefined => {
    const crianca = mockCriancas.find(c => c.id === id);
    if (crianca) {
        // Recalculate age for display consistency
        return {
            ...crianca,
            idade: calculateAgeString(crianca.dataNascimento)
        };
    }
    return undefined;
};

// --- Mock Functions for Convocation ---

export interface ConvocationData {
    cmei: string;
    turma: string;
}

// Mock list of CMEIs and their available turmas (simplified)
const mockAvailableTurmas = [
    { cmei: "CMEI Centro", turma: "Maternal I - Sala C", vagas: 5 },
    { cmei: "CMEI Norte", turma: "Pré II - Sala B", vagas: 3 },
    { cmei: "CMEI Sul", turma: "Berçário II - Sala A", vagas: 8 },
    { cmei: "CMEI Leste", turma: "Maternal II - Sala D", vagas: 2 },
    { cmei: "CMEI Oeste", turma: "Pré I - Sala A", vagas: 4 }, // Extra CMEI
];

export const fetchAvailableTurmas = async (criancaId: number): Promise<typeof mockAvailableTurmas> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const crianca = mockCriancas.find(c => c.id === criancaId);
    if (!crianca) return [];

    const preferredCmeis = [crianca.cmei1, crianca.cmei2].filter(Boolean);
    
    let availableTurmas = mockAvailableTurmas.filter(turma => turma.vagas > 0);

    if (crianca.aceitaQualquerCmei === 'nao') {
        // Only show preferred CMEIs
        availableTurmas = availableTurmas.filter(turma => preferredCmeis.includes(turma.cmei));
    } else {
        // Prioritize preferred CMEIs by moving them to the top
        availableTurmas.sort((a, b) => {
            const aPreferred = preferredCmeis.includes(a.cmei);
            const bPreferred = preferredCmeis.includes(b.cmei);
            
            if (aPreferred && !bPreferred) return -1;
            if (!aPreferred && bPreferred) return 1;
            return 0;
        });
    }
    
    // In a real system, we would also filter by age/turma base compatibility here.
    // For this mock, we assume all available turmas are compatible with the child's age group.

    return availableTurmas;
};

// Function to calculate the deadline (7 business days from now)
const calculateDeadline = (): string => {
    const today = new Date();
    let deadline = new Date(today);
    
    // Simple approximation: 7 days + 2 weekend days = 9 days total
    // In a real system, this would require complex calendar logic (holidays, weekends)
    deadline.setDate(deadline.getDate() + 9); 
    
    return deadline.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const convocarCrianca = async (criancaId: number, data: ConvocationData): Promise<Crianca> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockCriancas.findIndex(c => c.id === criancaId);
    if (index === -1) throw new Error("Criança não encontrada");

    const deadline = calculateDeadline();
    
    const updatedCrianca = {
        ...mockCriancas[index],
        status: "Convocado" as const,
        cmei: data.cmei,
        turmaAtual: data.turma,
        posicaoFila: undefined, // Remove from queue position
        convocacaoDeadline: deadline,
        historico: [
            ...mockCriancas[index].historico,
            {
                data: new Date().toISOString().split('T')[0],
                acao: "Convocação Enviada",
                detalhes: `Convocado para ${data.turma} no CMEI ${data.cmei}. Prazo: ${deadline}`,
                usuario: "Admin/Gestor",
            }
        ]
    };
    
    mockCriancas[index] = updatedCrianca;
    return updatedCrianca;
};

export const confirmarMatricula = async (criancaId: number): Promise<Crianca> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockCriancas.findIndex(c => c.id === criancaId);
    if (index === -1) throw new Error("Criança não encontrada");

    const existingCrianca = mockCriancas[index];
    
    if (existingCrianca.status !== 'Convocado' || !existingCrianca.cmei || !existingCrianca.turmaAtual) {
        throw new Error("A criança não está em status de convocação válida.");
    }

    const updatedCrianca = {
        ...existingCrianca,
        status: existingCrianca.sexo === 'feminino' ? "Matriculada" as const : "Matriculado" as const,
        posicaoFila: undefined,
        convocacaoDeadline: undefined,
        historico: [
            ...existingCrianca.historico,
            {
                data: new Date().toISOString().split('T')[0],
                acao: "Matrícula Efetivada",
                detalhes: `Matrícula confirmada para ${existingCrianca.turmaAtual} no CMEI ${existingCrianca.cmei}.`,
                usuario: "Admin/Gestor",
            }
        ]
    };
    
    mockCriancas[index] = updatedCrianca;
    return updatedCrianca;
};

export const marcarRecusada = async (criancaId: number, justificativa: string): Promise<Crianca> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockCriancas.findIndex(c => c.id === criancaId);
    if (index === -1) throw new Error("Criança não encontrada");

    const existingCrianca = mockCriancas[index];
    
    const updatedCrianca = {
        ...existingCrianca,
        status: "Recusada" as const,
        cmei: existingCrianca.cmei, // Mantém o CMEI da convocação para referência
        turmaAtual: existingCrianca.turmaAtual, // Mantém a turma da convocação para referência
        posicaoFila: undefined,
        convocacaoDeadline: undefined,
        historico: [
            ...existingCrianca.historico,
            {
                data: new Date().toISOString().split('T')[0],
                acao: "Convocação Recusada",
                detalhes: `Convocação recusada pelo responsável. Justificativa: ${justificativa}`,
                usuario: "Admin/Gestor",
            }
        ]
    };
    
    mockCriancas[index] = updatedCrianca;
    return updatedCrianca;
};

export const marcarDesistente = async (criancaId: number, justificativa: string): Promise<Crianca> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockCriancas.findIndex(c => c.id === criancaId);
    if (index === -1) throw new Error("Criança não encontrada");

    const updatedCrianca = {
        ...mockCriancas[index],
        status: "Desistente" as const,
        cmei: "N/A",
        turmaAtual: undefined,
        posicaoFila: undefined,
        convocacaoDeadline: undefined,
        historico: [
            ...mockCriancas[index].historico,
            {
                data: new Date().toISOString().split('T')[0],
                acao: "Marcado como Desistente",
                detalhes: `Criança removida da fila e marcada como desistente. Justificativa: ${justificativa}`,
                usuario: "Admin/Gestor",
            }
        ]
    };
    
    mockCriancas[index] = updatedCrianca;
    return updatedCrianca;
};

export const reativarCrianca = async (criancaId: number): Promise<Crianca> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockCriancas.findIndex(c => c.id === criancaId);
    if (index === -1) throw new Error("Criança não encontrada");

    // Simula a atribuição de posição no final da fila
    const newPosicaoFila = mockCriancas.filter(c => c.status === "Fila de Espera").length + 1;

    const updatedCrianca = {
        ...mockCriancas[index],
        status: "Fila de Espera" as const,
        cmei: "N/A",
        turmaAtual: undefined,
        posicaoFila: newPosicaoFila,
        convocacaoDeadline: undefined,
        historico: [
            ...mockCriancas[index].historico,
            {
                data: new Date().toISOString().split('T')[0],
                acao: "Reativação na Fila",
                detalhes: `Criança reativada na fila de espera. Posição: #${newPosicaoFila}.`,
                usuario: "Admin/Gestor",
            }
        ]
    };
    
    mockCriancas[index] = updatedCrianca;
    return updatedCrianca;
};

export const marcarFimDeFila = async (criancaId: number, justificativa: string): Promise<Crianca> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockCriancas.findIndex(c => c.id === criancaId);
    if (index === -1) throw new Error("Criança não encontrada");

    // Simula a atribuição de posição no final da fila
    const newPosicaoFila = mockCriancas.filter(c => c.status === "Fila de Espera").length + 1;

    const updatedCrianca = {
        ...mockCriancas[index],
        status: "Fila de Espera" as const,
        cmei: "N/A",
        turmaAtual: undefined,
        posicaoFila: newPosicaoFila,
        convocacaoDeadline: undefined,
        historico: [
            ...mockCriancas[index].historico,
            {
                data: new Date().toISOString().split('T')[0],
                acao: "Fim de Fila Solicitado",
                detalhes: `Convocação recusada/expirada e criança movida para o final da fila. Justificativa: ${justificativa}`,
                usuario: "Admin/Gestor",
            }
        ]
    };
    
    mockCriancas[index] = updatedCrianca;
    return updatedCrianca;
};