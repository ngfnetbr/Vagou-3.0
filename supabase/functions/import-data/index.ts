// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
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
    
    // Novos campos para migração de status
    status: string; // Ex: Matriculado, Fila de Espera, Remanejamento Solicitado
    cmei_atual_nome?: string;
    turma_atual_nome?: string;
    posicao_fila?: string; // Número
    convocacao_deadline?: string; // YYYY-MM-DD
    data_penalidade?: string; // YYYY-MM-DD
}

// Helper para buscar IDs de CMEI e Turma
async function getCmeiTurmaIds(supabase: any, cmeiName: string, turmaName: string): Promise<{ cmei_id: string | null, turma_id: string | null }> {
    if (!cmeiName || !turmaName) {
        return { cmei_id: null, turma_id: null };
    }

    // 1. Buscar CMEI ID
    const { data: cmeiData, error: cmeiError } = await supabase
        .from('cmeis')
        .select('id')
        .eq('nome', cmeiName)
        .limit(1)
        .single();

    if (cmeiError || !cmeiData) {
        throw new Error(`CMEI não encontrado: ${cmeiName}`);
    }
    const cmei_id = cmeiData.id;

    // 2. Buscar Turma ID
    const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('id')
        .eq('nome', turmaName)
        .eq('cmei_id', cmei_id)
        .limit(1)
        .single();

    if (turmaError || !turmaData) {
        throw new Error(`Turma não encontrada: ${turmaName} no CMEI ${cmeiName}`);
    }
    const turma_id = turmaData.id;

    return { cmei_id, turma_id };
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
            // 1. Validação básica
            if (!record.nome || !record.data_nascimento || !record.responsavel_cpf || !record.status) {
                 throw new Error("Missing required fields (Nome, Data Nascimento, CPF, Status).");
            }
            
            let cmei_atual_id = null;
            let turma_atual_id = null;
            
            // 2. Se houver CMEI/Turma atual, busca os IDs
            if (record.cmei_atual_nome && record.turma_atual_nome) {
                const ids = await getCmeiTurmaIds(supabase, record.cmei_atual_nome, record.turma_atual_nome);
                cmei_atual_id = ids.cmei_id;
                turma_atual_id = ids.turma_id;
            }

            // 3. Prepara o payload
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
                
                // Campos de Status/Vaga
                status: record.status, 
                cmei_atual_id: cmei_atual_id,
                turma_atual_id: turma_atual_id,
                posicao_fila: record.posicao_fila ? parseInt(record.posicao_fila) : null,
                convocacao_deadline: record.convocacao_deadline || null,
                data_penalidade: record.data_penalidade || null,
            };

            // 4. Insert into criancas table
            const { error: insertError } = await supabase
                .from('criancas')
                // Desabilitamos o RLS para esta inserção de migração, usando o service_role_key
                // NOTA: Como estamos usando o token do usuário logado, o RLS deve estar configurado para permitir a inserção.
                // Assumindo que o RLS permite a inserção por usuários autenticados.
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
    // Isso garante que a fila seja reordenada corretamente, mesmo com posições_fila importadas.
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