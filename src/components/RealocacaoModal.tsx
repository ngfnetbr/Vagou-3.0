"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, X, Loader2, RotateCcw } from "lucide-react";
import { Crianca, ConvocationData } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useGroupedAvailableTurmas } from "@/hooks/use-grouped-available-turmas";
import CmeiTurmaSelector from "./CmeiTurmaSelector"; // Importando o novo componente

// Schema for Realocation Form
const vagaSchema = z.object({
  // O valor do select será uma string combinada: "cmei_id|turma_id|cmei_nome|turma_nome"
  cmeiTurma: z.string().min(1, "Selecione uma Turma disponível."),
});

type VagaFormData = z.infer<typeof vagaSchema>;

interface RealocacaoModalProps {
  crianca: Crianca;
  onClose: () => void;
  onConfirm: (criancaId: string, data: ConvocationData) => Promise<void>; // ID agora é string
  isPending: boolean;
}

const RealocacaoModal = ({ crianca, onClose, onConfirm, isPending }: RealocacaoModalProps) => {
  // Hook que busca e agrupa todas as turmas disponíveis
  const { allAvailableTurmas, isLoading: isLoadingTurmas } = useGroupedAvailableTurmas();

  const form = useForm<VagaFormData>({
    resolver: zodResolver(vagaSchema),
    defaultValues: {
      cmeiTurma: "",
    },
  });

  const onSubmit = async (values: VagaFormData) => {
    // values.cmeiTurma is a combined string: "cmei_id|turma_id|cmei_nome|turma_nome"
    const parts = values.cmeiTurma.split('|');
    
    if (parts.length !== 4) {
        toast.error("Erro de seleção", { description: "Formato de CMEI/Turma inválido." });
        return;
    }
    
    const [cmei_id, turma_id] = parts;

    const convocationData: ConvocationData = { cmei_id, turma_id };

    try {
        await onConfirm(crianca.id, convocationData);
        onClose();
    } catch (error) {
        // Error handled by useCriancas hook
    }
  };
  
  const isSubmitting = isPending || isLoadingTurmas;

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Realocar {crianca.nome}</DialogTitle>
        <DialogDescription>
          Selecione a nova turma e CMEI para realocar a criança.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-3 text-sm p-3 bg-muted/50 rounded-lg border border-border">
        <p className="font-semibold">Localização Atual:</p>
        <p className="text-muted-foreground">
            {crianca.cmeiNome && crianca.turmaNome 
                ? `${crianca.cmeiNome} (${crianca.turmaNome})` 
                : 'Fila de Espera'
            }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="cmeiTurma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova Turma *</FormLabel>
                <FormControl>
                    <CmeiTurmaSelector
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            
            <Button 
                type="submit" 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={isSubmitting || !form.formState.isValid || allAvailableTurmas.length === 0}
            >
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Confirmar Realocação
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default RealocacaoModal;