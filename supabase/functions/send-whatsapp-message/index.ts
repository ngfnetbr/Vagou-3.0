// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URL base da API Z-API
const ZAPI_BASE_URL = 'https://api.z-api.io/instances/';

// Helper para limpar e formatar o telefone para o padrão E.164 (55 + DDD + Número)
function formatPhoneForZapi(phone: string): string | null {
    if (!phone) return null;
    
    let cleanPhone = phone.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    // Se o número já começar com 55, remove para revalidar o comprimento
    if (cleanPhone.startsWith('55')) {
        cleanPhone = cleanPhone.substring(2);
    }
    
    // Esperamos 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 + 8 dígitos)
    // O Z-API espera o formato 55 + DDD + Número.
    
    if (cleanPhone.length === 10 || cleanPhone.length === 11) { 
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
    
    // 2. Lendo as chaves Z-API diretamente das variáveis de ambiente (Secrets)
    // @ts-ignore
    const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID');
    // @ts-ignore
    const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN');

    // 3. Validação de Segredos
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
        // LOG DE DEBUG CRÍTICO
        console.error(`[ZAPI CRITICAL DEBUG] Keys read from ENV: Instance ID present: ${!!ZAPI_INSTANCE_ID}, Token present: ${!!ZAPI_TOKEN}`);
        
        return new Response(JSON.stringify({ error: 'Z-API secrets not configured in Supabase Secrets. Cannot send message.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    
    // LOG DE DEBUG: Confirma que as chaves foram lidas
    console.log(`[ZAPI DEBUG] Keys successfully read from ENV. Instance ID length: ${ZAPI_INSTANCE_ID.length}, Token length: ${ZAPI_TOKEN.length}`);


    // 4. Receber dados da requisição
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
    
    // 5. Limpeza e Validação do Telefone
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
    
    // 6. Preparar payload para o Z-API
    const zapiPayload = {
        phone: formattedPhone,
        message: message,
    };
    
    // CONSTRUÇÃO DO URL FINAL: Base + ID da Instância + /token/ + Token + /send-text
    const finalUrl = `${ZAPI_BASE_URL}${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

    // 7. Enviar requisição para o Z-API
    const zapiResponse = await fetch(finalUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(zapiPayload),
    });

    const zapiResult = await zapiResponse.json();

    // 8. VERIFICAÇÃO DE STATUS HTTP
    if (!zapiResponse.ok) {
        console.error('Z-API Error:', zapiResult);
        
        let zapiErrorMessage = zapiResult.error || zapiResult.message || JSON.stringify(zapiResult);
        
        // Se o erro for de autenticação/token, tentamos dar um feedback mais claro
        if (zapiErrorMessage.includes('client-token is not configured') || zapiErrorMessage.includes('Invalid token')) {
             zapiErrorMessage = "Token de acesso (ZAPI_TOKEN) não configurado ou inválido no Z-API. Verifique as credenciais salvas.";
        }
        
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