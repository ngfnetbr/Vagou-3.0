// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    const { criancaId } = await req.json();
    if (!criancaId) {
        return new Response(JSON.stringify({ error: 'criancaId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 1. Inicializa o cliente Supabase com o token do usuário logado
    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // 2. Busca o URL do Webhook e os dados da criança
    const [configResult, criancaResult] = await Promise.all([
        supabase.from('configuracoes_sistema').select('webhook_url_notificacao').eq('id', 1).single(),
        supabase.from('criancas').select('*, cmeis!criancas_cmei_atual_id_fkey(nome), turmas!criancas_turma_atual_id_fkey(nome)').eq('id', criancaId).single(),
    ]);

    if (configResult.error || !configResult.data) {
        throw new Error('Webhook URL not configured or database error.');
    }
    const webhook_url = configResult.data.webhook_url_notificacao;

    if (criancaResult.error || !criancaResult.data) {
        throw new Error('Child not found.');
    }
    const crianca = criancaResult.data;
    
    if (!webhook_url) {
        return new Response(JSON.stringify({ error: 'Webhook URL is not set in system configuration.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 3. Constrói o payload (similar ao trigger do DB)
    const payload = {
        crianca_id: crianca.id,
        status: crianca.status,
        responsavel_nome: crianca.responsavel_nome,
        responsavel_telefone: crianca.responsavel_telefone,
        responsavel_email: crianca.responsavel_email,
        cmei_nome: crianca.cmeis?.nome || 'N/A',
        turma_nome: crianca.turmas?.nome || 'N/A',
        convocacao_deadline: crianca.convocacao_deadline,
        data_acao: new Date().toISOString(),
        // Adiciona um flag para indicar que é um reenvio manual, se necessário para o Make
        is_resend: true, 
    };

    // 4. Dispara o Webhook usando fetch (chamada externa)
    const webhookResponse = await fetch(webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    
    if (!webhookResponse.ok) {
        // Tenta ler o erro do webhook, se possível
        let webhookError = `Webhook failed with status ${webhookResponse.status}`;
        try {
            const errorBody = await webhookResponse.json();
            webhookError += `: ${JSON.stringify(errorBody)}`;
        } catch {
            // ignore
        }
        throw new Error(webhookError);
    }
    
    // 5. Registra no histórico (opcional, mas útil)
    const user = crianca.responsavel_email || 'Usuário Admin'; // Usamos o email do responsável como fallback
    await supabase.from('historico').insert({
        crianca_id: criancaId,
        acao: "Notificação Reenviada (Webhook)",
        detalhes: `Notificação de status ${crianca.status} reenviada manualmente.`,
        usuario: user,
    });

    return new Response(JSON.stringify({ message: 'Notification resent successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})