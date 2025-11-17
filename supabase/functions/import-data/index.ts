import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { parse } from 'https://esm.sh/csv-parse@5.5.3/sync';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the expected CSV structure for children data
interface ChildImportRow {
    nome: string;
    data_nascimento: string; // YYYY-MM-DD
    sexo: 'M' | 'F';
    programas_sociais: 'Sim' | 'Não';
    aceita_qualquer_cmei: 'Sim' | 'Não';
    cmei1_preferencia: string; // Nome/Identificador do CMEI
    cmei2_preferencia?: string; // Optional
    responsavel_nome: string;
    responsavel_cpf: string;
    responsavel_telefone: string;
    responsavel_email: string;
    endereco: string;
    bairro: string;
    observacoes: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Manual authentication handling (since verify_jwt is false)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    const { csvContent } = await req.json();

    if (!csvContent) {
      return new Response(JSON.stringify({ error: 'CSV content is missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
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
    
    // Parse CSV content
    const records: ChildImportRow[] = parse(csvContent, {
      columns: true, 
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
        return new Response(JSON.stringify({ message: 'No records found in CSV.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const importResults = {
        totalRecords: records.length,
        successCount: 0,
        errorCount: 0,
        errors: [] as { row: number, error: string }[],
    };

    // Process records
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNumber = i + 2; 

        try {
            // Prepare data for insertion
            const childData = {
                nome: record.nome,
                data_nascimento: record.data_nascimento,
                sexo: record.sexo,
                programas_sociais: record.programas_sociais?.toLowerCase() === 'sim',
                aceita_qualquer_cmei: record.aceita_qualquer_cmei?.toLowerCase() === 'sim',
                cmei1_preferencia: record.cmei1_preferencia,
                cmei2_preferencia: record.cmei2_preferencia || null,
                responsavel_nome: record.responsavel_nome,
                responsavel_cpf: record.responsavel_cpf,
                responsavel_telefone: record.responsavel_telefone,
                responsavel_email: record.responsavel_email,
                endereco: record.endereco,
                bairro: record.bairro,
                observacoes: record.observacoes,
                status: 'Fila de Espera', 
            };

            // Basic validation check (e.g., required fields)
            if (!childData.nome || !childData.data_nascimento || !childData.responsavel_cpf) {
                 throw new Error("Missing required fields (Nome, Data Nascimento, CPF).");
            }

            // Insert into criancas table
            const { error: insertError } = await supabase
                .from('criancas')
                .insert([childData]);

            if (insertError) {
                throw new Error(insertError.message);
            }

            importResults.successCount++;

        } catch (e) {
            importResults.errorCount++;
            importResults.errors.push({ row: rowNumber, error: e.message });
        }
    }

    // After successful import, trigger recalculation of the queue position
    await supabase.rpc('recalculate_fila_posicao');


    return new Response(JSON.stringify({ 
        message: 'Import process finished.',
        results: importResults
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