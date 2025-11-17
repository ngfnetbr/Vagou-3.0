// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// O URL e a chave do Z-API devem ser configurados como segredos no Supabase Console.
// Exemplo de segredos necessários: ZAPI_URL (agora deve ser o ID da instância), ZAPI_TOKEN
// @ts-ignore
const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_URL'); // Reutilizando ZAPI_URL para o ID da instância
// @ts-ignore
const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN');

// URL base da API Z-API
const ZAPI_BASE_URL = 'https://api.z-api.io/instances/';

// Helper para limpar e formatar o telefone para o padrão E.164 (55 + DDD + Número)
function formatPhoneForZapi(phone: string): string | null {
    if (!phone) return null;
    
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Se o número já começar com 55, assumimos que está correto
    if (cleanPhone.startsWith('55')) {
        // Remove o 55 para revalidar o comprimento
        cleanPhone = cleanPhone.substring(2);
    }
    
    // Esperamos 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 + 8 dígitos)
    if (cleanPhone.length === 10) { // Ex: 4488887777 (sem o 9)
        // Adiciona o 9 se for um número de celular (assumindo que todos são celulares)
        // Isso é arriscado, mas necessário se o número foi salvo sem o 9.
        // Vamos manter a lógica mais simples: se tiver 10 ou 11 dígitos, adiciona 55.
        return `55${cleanPhone}`;
    }
    
    if (cleanPhone.length === 11) { // Ex: 44988887777 (com o 9)
        return `55${cleanPhone}`;
    }
    
    // Se o número for muito longo ou muito curto, é inválido
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return null;
    }
    
    return `55${cleanPhone}`;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  let phone: string | undefined;
  let message: string | undefined;
  
  try {
    // 1. Autenticação Manual (Verifica se o usuário está logado)
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 2. Inicializa o Supabase Client com Service Role Key para acesso ao DB
    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usando Service Role Key
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // 3. Verifica a configuração de notificação do WhatsApp no DB
    const { data: configData, error: configError } = await supabase
        .from('configuracoes_sistema')
        .select('notificacao_whatsapp')
        .eq('id', 1)
        .single();
        
    if (configError) {
        console.error('DB Config Error:', configError);
        return new Response(JSON.stringify({ error: 'Failed to fetch notification configuration from database.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    
    if (!configData.notificacao_whatsapp) {
        return new Response(JSON.stringify({ message: 'WhatsApp notifications are disabled in system configuration.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 4. Validação de Segredos
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
        console.error(`[ZAPI DEBUG] ZAPI_INSTANCE_ID configured: ${!!ZAPI_INSTANCE_ID}, ZAPI_TOKEN configured: ${!!ZAPI_TOKEN}`);
        
        return new Response(JSON.stringify({ error: 'Z-API secrets not configured in environment. Cannot send message.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 5. Receber dados da requisição
    try {
        const body = await req.json();
        phone = body.phone;
        message = body.message;
    } catch (e) {
        console.error('Error parsing request body:', e);
        return new Response(JSON.stringify({ error: 'Invalid JSON body received.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // 6. Limpeza e Validação do Telefone
    const formattedPhone = formatPhoneForZapi(phone || '');
    
    console.log(`[DEBUG] Original Phone: ${phone}, Formatted Phone: ${formattedPhone}, Message Length: ${message?.length}`);

    if (!formattedPhone || !message) {
      return new Response(JSON.stringify({ 
          error: 'Missing required fields: phone and message, or phone format is invalid.',
          debug_phone: phone,
          debug_message_length: message?.length,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 7. Preparar payload para o Z-API
    const zapiPayload = {
        phone: formattedPhone,
        message: message,
    };
    
    // CONSTRUÇÃO DO URL FINAL CORRETO: Base + ID da Instância + /send-text?token=Token
    const finalUrl = `${ZAPI_BASE_URL}${ZAPI_INSTANCE_ID}/send-text?token=${ZAPI_TOKEN}`;

    // 8. Enviar requisição para o Z-API
    const zapiResponse = await fetch(finalUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(zapiPayload),
    });

    const zapiResult = await zapiResponse.json();

    if (!zapiResponse.ok) {
        console.error('Z-API Error:', zapiResult);
        
        let zapiErrorMessage = zapiResult.error || zapiResult.message || JSON.stringify(zapiResult);
        
        return new Response(JSON.stringify({ 
            error: `Failed to send message via Z-API: ${zapiErrorMessage}`, 
            details: zapiResult,
            zapi_status: zapiResponse.status,
        }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ 
        message: 'WhatsApp message sent successfully', 
        zapiResult 
    }), {
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