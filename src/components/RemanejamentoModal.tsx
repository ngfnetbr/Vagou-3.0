"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X, ArrowRight } from "lucide-react";
import { Crianca } from "@/integrations/supabase/types";
import { useCMEIs } from "@/hooks/use-cmeis";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Schema for Remanejamento Form
const remanejamentoSchema = z.object({
  cmeiId: z.string().uuid("Selecione um CMEI válido.").min(1, "O CMEI de destino é obrigatório."),
  justificativa: z.string().min(10, "A justificativa deve ter pelo menos 10 caracteres."),
});

type RemanejamentoFormData = z.infer<typeof remanejamentoSchema>;

interface RemanejamentoModalProps {
  crianca: Crianca;
  onClose: () => void;
  onConfirm: (criancaId: string, cmeiId: string, cmeiNome: string, justificativa: string) => Promise<void>;
  isPending: boolean;
}

const RemanejamentoModal = ({ crianca, onClose, onConfirm, isPending }: RemanejamentoModalProps) => {
  const { cmeis, isLoading: isLoadingCmeis } = useCMEIs();
  
  // Filtra o CMEI atual para que o remanejamento seja para outro local
  const cmeiOptions = (cmeis || []).filter(c => c.id !== crianca.cmei_atual_id);

  const form = useForm<RemanejamentoFormData>({
    resolver: zodResolver(remanejamentoSchema),
    defaultValues: {
      cmeiId: "",
      justificativa: "",
    },
  });

  const onSubmit = async (values: RemanejamentoFormData) => {
    const cmeiDestino = cmeiOptions.find(c => c.id === values.cmeiId);
    
    if (!cmeiDestino) {
        toast.error("Erro de validação", { description: "CMEI de destino não encontrado." });
        return;
    }
    
    try {
        await onConfirm(crianca.id, values.cmeiId, cmeiDestino.nome, values.justificativa);
        onClose();
    } catch (error) {
        // Error handled by useCriancas hook
    }
  };
  
  const isSubmitting = isPending || isLoadingCmeis;

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Solicitar Remanejamento para {crianca.nome}</DialogTitle>
        <DialogDescription>
          Selecione o CMEI de destino e forneça uma justificativa. A criança será inserida na fila de prioridade máxima.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-3 text-sm p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="font-semibold text-primary">Matrícula Atual:</p>
        <p className="text-muted-foreground">
            {crianca.cmeiNome} ({crianca.turmaNome})
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          
          {/* Seleção do CMEI de Destino */}
          <FormField
            control={form.control}
            name="cmeiId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CMEI de Destino *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isSubmitting || cmeiOptions.length === 0}>
                      <SelectValue placeholder={isLoadingCmeis ? "Carregando CMEIs..." : "Selecione o CMEI desejado"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cmeiOptions.map((cmei) => (
                      <SelectItem key={cmei.id} value={cmei.id}>
                        {cmei.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Justificativa */}
          <FormField
            control={form.control}
            name="justificativa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Justificativa *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o motivo da solicitação de remanejamento (mínimo 10 caracteres)" 
                    rows={4}
                    {...field} 
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
                disabled={isSubmitting || !form.formState.isValid || cmeiOptions.length === 0}
            >
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Solicitar Remanejamento
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default RemanejamentoModal;