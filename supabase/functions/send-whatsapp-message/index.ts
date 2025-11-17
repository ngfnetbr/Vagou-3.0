import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// O URL e a chave do Z-API devem ser configurados como segredos no Supabase Console.
// Exemplo de segredos necessários: ZAPI_URL, ZAPI_TOKEN
const ZAPI_URL = Deno.env.get('ZAPI_URL');
const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // 1. Autenticação Manual (Verifica se o usuário está logado)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 2. Validação de Segredos
    if (!ZAPI_URL || !ZAPI_TOKEN) {
        return new Response(JSON.stringify({ error: 'Z-API secrets not configured in environment.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 3. Receber dados da requisição
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone and message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 4. Formatar o número de telefone (Remover caracteres não numéricos e garantir código do país)
    const cleanPhone = phone.replace(/\D/g, '');
    // Assumindo que o número já inclui o código do país (e.g., 55) e o DDD.
    // Se o Z-API exigir um formato específico (e.g., 5599999999999), ajuste aqui.
    
    // 5. Preparar payload para o Z-API
    const zapiPayload = {
        phone: cleanPhone,
        message: message,
        // Adicione outros parâmetros específicos do Z-API, se necessário
    };

    // 6. Enviar requisição para o Z-API
    const zapiResponse = await fetch(`${ZAPI_URL}/send-message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ZAPI_TOKEN}`, // Usando o token secreto
        },
        body: JSON.stringify(zapiPayload),
    });

    const zapiResult = await zapiResponse.json();

    if (!zapiResponse.ok) {
        console.error('Z-API Error:', zapiResult);
        return new Response(JSON.stringify({ 
            error: 'Failed to send message via Z-API', 
            details: zapiResult 
        }), {
            status: zapiResponse.status,
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