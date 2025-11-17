import { supabase } from "@/integrations/supabase/client";

interface ImportResult {
    totalRecords: number;
    successCount: number;
    errorCount: number;
    errors: { row: number, error: string }[];
}

// Supabase Project ID: bibsduqgpmeuwbsgdoih
const SUPABASE_PROJECT_ID = "bibsduqgpmeuwbsgdoih"; 
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/import-data`;

/**
 * Calls the Supabase Edge Function to import children data from a CSV string.
 * Requires the user to be authenticated.
 * @param csvContent The raw CSV content as a string.
 * @returns A promise resolving to the import results summary.
 */
export async function importChildrenData(csvContent: string): Promise<ImportResult> {
    // Usamos getSession() para obter a sessão e o token de acesso
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.access_token) {
        throw new Error("User is not authenticated or session token is missing.");
    }
    
    const access_token = session.access_token;

    const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({ csvContent }),
    });

    const result = await response.json();

    if (!response.ok) {
        // Se o erro for 401, o backend retornou 'Unauthorized'
        if (response.status === 401) {
            throw new Error("Unauthorized: Acesso negado. Verifique se você está logado.");
        }
        throw new Error(result.error || "Failed to import data via Edge Function.");
    }

    return result.results as ImportResult;
}