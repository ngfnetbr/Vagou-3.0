"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Loader2, Bell } from "lucide-react";
import { Crianca, ConvocationData } from "@/integrations/supabase/criancas"; // Importação atualizada
import { useAvailableTurmas, useCriancas } from "@/hooks/use-criancas";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Schema for Convocation Form
const convocarSchema = z.object({
  // O valor do select será uma string combinada: "cmei_id|turma_id"
  cmeiTurma: z.string().min(1, "Selecione um CMEI e Turma disponíveis."),
});

type ConvocarFormData = z.infer<typeof convocarSchema>;

interface ConvocarModalProps {
  crianca: Crianca;
  onClose: () => void;
}

const ConvocarModal = ({ crianca, onClose }: ConvocarModalProps) => {
  const { data: availableTurmas, isLoading: isLoadingTurmas } = useAvailableTurmas(crianca.id);
  const { convocarCrianca, isConvoking } = useCriancas();

  const form = useForm<ConvocarFormData>({
    resolver: zodResolver(convocarSchema),
    defaultValues: {
      cmeiTurma: "",
    },
  });

  const onSubmit = async (values: ConvocarFormData) => {
    // values.cmeiTurma is a combined string: "cmei_id|turma_id"
    const [cmei_id, turma_id] = values.cmeiTurma.split('|');
    
    if (!cmei_id || !turma_id) {
        toast.error("Erro de seleção", { description: "Formato de CMEI/Turma inválido." });
        return;
    }

    const convocationData: ConvocationData = { cmei_id, turma_id };

    try {
        await convocarCrianca({ id: crianca.id, data: convocationData });
        onClose();
    } catch (error) {
        // Error handled by useCriancas hook
    }
  };
  
  const preferredCmeis = [crianca.cmei1_preferencia, crianca.cmei2_preferencia].filter(Boolean);
  const isReconvocacao = crianca.status === 'Convocado' && crianca.convocacao_deadline && new Date(crianca.convocacao_deadline) < new Date();

  const modalTitle = isReconvocacao ? `Reconvocar ${crianca.nome}` : `Convocar ${crianca.nome}`;
  const modalDescription = isReconvocacao 
    ? "O prazo anterior expirou. Selecione uma nova vaga para reconvocar a criança."
    : "Selecione o CMEI e a turma para a qual a criança será convocada.";

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{modalTitle}</DialogTitle>
        <DialogDescription>
          {modalDescription}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-3 text-sm p-3 bg-muted/50 rounded-lg border border-border">
        <p className="font-semibold">Preferências da Criança:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>1ª Opção: {crianca.cmei1_preferencia}</li>
            {crianca.cmei2_preferencia && <li>2ª Opção: {crianca.cmei2_preferencia}</li>}
            <li>Aceita qualquer CMEI: <span className="font-medium capitalize">{crianca.aceita_qualquer_cmei ? 'sim' : 'nao'}</span></li>
        </ul>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => { /* Trigger AlertDialog */ })} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="cmeiTurma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vaga Disponível *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingTurmas || isConvoking}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingTurmas ? "Buscando vagas..." : "Selecione o CMEI e Turma"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingTurmas ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : availableTurmas && availableTurmas.length > 0 ? (
                        availableTurmas.map((turma, index) => {
                            const isPreferred = preferredCmeis.includes(turma.cmei);
                            const label = `${turma.cmei} - ${turma.turma} (${turma.vagas} vagas)`;
                            
                            return (
                                <SelectItem 
                                    key={index} 
                                    value={`${turma.cmei_id}|${turma.turma_id}`} // Usando IDs
                                    className={isPreferred ? "font-semibold text-primary" : ""}
                                >
                                    {label}
                                </SelectItem>
                            );
                        })
                    ) : (
                        <SelectItem value="none" disabled>Nenhuma vaga compatível encontrada.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isConvoking}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                    type="button" 
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    disabled={isConvoking || !form.formState.isValid || isLoadingTurmas}
                >
                    <Bell className="mr-2 h-4 w-4" />
                    {isReconvocacao ? "Reconvocar" : "Convocar"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar {isReconvocacao ? "Reconvocação" : "Convocação"}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a {isReconvocacao ? "reconvocar" : "convocar"} <span className="font-semibold">{crianca.nome}</span> para a vaga selecionada.
                    O responsável terá 7 dias úteis para efetivar a matrícula.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isConvoking}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={form.handleSubmit(onSubmit)} 
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    disabled={isConvoking}
                  >
                    {isConvoking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        `Confirmar ${isReconvocacao ? "Reconvocação" : "Convocação"}`
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default ConvocarModal;