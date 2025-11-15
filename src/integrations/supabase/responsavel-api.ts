import { supabase } from "@/integrations/supabase/client";

// Define a estrutura dos dados do responsável que queremos retornar
export interface ResponsavelData {
    nomeResponsavel: string;
    cpf: string;
    telefone: string;
    telefone2?: string;
    email?: string;
    endereco?: string;
    bairro?: string;
}

/**
 * Busca dados do responsável e endereço com base no CPF.
 * Retorna os dados do responsável da criança mais recentemente cadastrada com esse CPF.
 * @param cpf CPF formatado (000.000.000-00).
 * @returns ResponsavelData ou null se não encontrado.
 */
export const fetchResponsavelByCpf = async (cpf: string): Promise<ResponsavelData | null> => {
    // Busca a criança mais recente com o CPF fornecido
    const { data, error } = await supabase
        .from('criancas')
        .select(`
            responsavel_nome,
            responsavel_cpf,
            responsavel_telefone,
            responsavel_email,
            endereco,
            bairro
        `)
        .eq('responsavel_cpf', cpf) // Assume que o DB armazena o CPF formatado
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error("Erro ao buscar responsável por CPF:", error);
        throw new Error(error.message);
    }
    
    if (!data) return null;
    
    return {
        nomeResponsavel: data.responsavel_nome,
        cpf: data.responsavel_cpf,
        telefone: data.responsavel_telefone,
        telefone2: data.responsavel_telefone, // Usando o mesmo telefone para o campo 2, se necessário
        email: data.responsavel_email || undefined,
        endereco: data.endereco || undefined,
        bairro: data.bairro || undefined,
    };
};