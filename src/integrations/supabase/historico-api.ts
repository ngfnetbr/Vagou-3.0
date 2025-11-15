import { supabase } from "@/integrations/supabase/client";
import { HistoricoEntry } from "./types";

// Busca o histórico real da criança
export const fetchHistoricoCrianca = async (criancaId: string): Promise<HistoricoEntry[]> => {
    const { data, error } = await supabase
        .from('historico')
        .select('data, acao, detalhes, usuario, created_at') // Incluindo created_at
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
        created_at: h.created_at, // Mapeando created_at
    }));
};

// Busca o histórico geral do sistema
export const fetchHistoricoGeral = async (): Promise<HistoricoEntry[]> => {
    const { data, error } = await supabase
        .from('historico')
        .select('data, acao, detalhes, usuario, created_at') // Incluindo created_at
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    
    // Mapeia a estrutura do DB para HistoricoEntry
    return data.map(h => ({
        data: h.data,
        acao: h.acao,
        detalhes: h.detalhes,
        usuario: h.usuario,
        created_at: h.created_at, // Mapeando created_at
    }));
};