import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipagem baseada na tabela 'configuracoes_sistema'
export interface Configuracoes {
  id: number;
  nome_municipio: string;
  nome_secretaria: string;
  email_contato?: string;
  telefone_contato?: string;
  data_inicio_inscricao?: string; // YYYY-MM-DD
  data_fim_inscricao?: string; // YYYY-MM-DD
  prazo_resposta_dias: number;
  notificacao_email: boolean;
  notificacao_sms: boolean;
  notificacao_whatsapp: boolean; // NOVO CAMPO
  zapi_instance_id?: string; // NOVO CAMPO
  zapi_token?: string; // NOVO CAMPO
  webhook_url_notificacao?: string; // NOVO CAMPO
  updated_at: string;
}

// Tipagem para dados de formulário (apenas campos editáveis)
export type ConfiguracoesFormData = Omit<Configuracoes, 'id' | 'updated_at'>;

const CONFIG_QUERY_KEY = ["configuracoes"];

// --- Funções de API (Supabase) ---

const fetchConfiguracoes = async (): Promise<Configuracoes> => {
  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  
  // Garante que datas nulas sejam strings vazias para o formulário
  return {
    ...data,
    data_inicio_inscricao: data.data_inicio_inscricao || '',
    data_fim_inscricao: data.data_fim_inscricao || '',
    email_contato: data.email_contato || '',
    telefone_contato: data.telefone_contato || '',
    notificacao_whatsapp: data.notificacao_whatsapp ?? false, // Garante valor padrão
    zapi_instance_id: data.zapi_instance_id || '', // Garante valor padrão
    zapi_token: data.zapi_token || '', // Garante valor padrão
    webhook_url_notificacao: data.webhook_url_notificacao || '', // Garante valor padrão
  } as Configuracoes;
};

const updateConfiguracoes = async (data: ConfiguracoesFormData): Promise<Configuracoes> => {
  // Filtra campos vazios para garantir que null seja enviado para o DB, se necessário
  const payload = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
  );
  
  const { data: updatedConfig, error } = await supabase
    .from('configuracoes_sistema')
    .update(payload)
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar configurações: ${error.message}`);
  }
  return updatedConfig as Configuracoes;
};

// --- Hook Principal ---

export function useConfiguracoes() {
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery<Configuracoes>({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: fetchConfiguracoes,
    staleTime: 1000 * 60 * 5, // Configurações não mudam frequentemente
  });

  const updateMutation = useMutation({
    mutationFn: updateConfiguracoes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (e) => {
      toast.error("Erro ao salvar configurações.", {
        description: e.message,
      });
    },
  });

  return {
    config: config,
    isLoading,
    error,
    updateConfiguracoes: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}