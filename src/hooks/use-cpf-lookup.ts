import { useFormContext } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { fetchResponsavelByCpf } from "@/integrations/supabase/responsavel-api";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function useCpfLookup() {
    const { setValue, watch, getFieldState } = useFormContext<InscricaoFormData>();
    const cpf = watch("cpf");
    const [lastCheckedCpf, setLastCheckedCpf] = useState<string | null>(null);

    const lookupMutation = useMutation({
        mutationFn: fetchResponsavelByCpf,
        onSuccess: (data) => {
            if (data) {
                // Preenche os campos do responsável e endereço
                setValue("nomeResponsavel", data.nomeResponsavel, { shouldValidate: true });
                setValue("telefone", data.telefone, { shouldValidate: true });
                setValue("telefone2", data.telefone2 || '', { shouldValidate: true });
                setValue("email", data.email || '', { shouldValidate: true });
                setValue("endereco", data.endereco || '', { shouldValidate: true });
                setValue("bairro", data.bairro || '', { shouldValidate: true });
                
                toast.info("Dados do responsável preenchidos automaticamente.", {
                    description: "CPF encontrado em cadastros anteriores.",
                });
            } else {
                // Se não encontrar, limpa apenas os campos que seriam preenchidos
                setValue("nomeResponsavel", "", { shouldValidate: true });
                setValue("telefone", "", { shouldValidate: true });
                setValue("telefone2", "");
                setValue("email", "");
                setValue("endereco", "");
                setValue("bairro", "");
                
                // Não mostra toast se o campo estiver vazio, apenas se for uma busca ativa
                if (cpf.length > 0) {
                    toast.info("CPF não encontrado.", {
                        description: "Prossiga com o preenchimento manual.",
                    });
                }
            }
        },
        onError: (e) => {
            toast.error("Erro na consulta de CPF.", {
                description: e.message,
            });
        },
    });
    
    const { error } = getFieldState('cpf');
    
    // Efeito para disparar a busca quando o CPF estiver completo e válido
    useEffect(() => {
        // Verifica se o CPF está no formato completo (000.000.000-00)
        const isFormattedAndComplete = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
        
        if (isFormattedAndComplete && !error && cpf !== lastCheckedCpf) {
            setLastCheckedCpf(cpf);
            lookupMutation.mutate(cpf);
        }
        
        // Se o CPF for apagado ou incompleto, resetamos o lastCheckedCpf
        if (!isFormattedAndComplete && lastCheckedCpf) {
            setLastCheckedCpf(null);
        }
        
    }, [cpf, error, lastCheckedCpf, lookupMutation]);

    return {
        isLookingUp: lookupMutation.isPending,
    };
}