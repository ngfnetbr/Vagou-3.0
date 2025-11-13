"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Loader2, Bell } from "lucide-react";
import { Crianca, ConvocationData } from "@/lib/mock-data";
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
    // values.cmeiTurma is a combined string: "CMEI Nome|Turma Nome"
    const [cmei, turma] = values.cmeiTurma.split('|');
    
    if (!cmei || !turma) {
        toast.error("Erro de seleção", { description: "Formato de CMEI/Turma inválido." });
        return;
    }

    const convocationData: ConvocationData = { cmei, turma };

    try {
        await convocarCrianca({ id: crianca.id, data: convocationData });
        onClose();
    } catch (error) {
        // Error handled by useCriancas hook
    }
  };
  
  const preferredCmeis = [crianca.cmei1, crianca.cmei2].filter(Boolean);
  const aceitaQualquerCmei = crianca.aceitaQualquerCmei === 'sim';

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Convocar {crianca.nome}</DialogTitle>
        <DialogDescription>
          Selecione o CMEI e a turma para a qual a criança será convocada.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-3 text-sm p-3 bg-muted/50 rounded-lg border border-border">
        <p className="font-semibold">Preferências da Criança:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>1ª Opção: {crianca.cmei1}</li>
            {crianca.cmei2 && <li>2ª Opção: {crianca.cmei2}</li>}
            <li>Aceita qualquer CMEI: <span className="font-medium capitalize">{crianca.aceitaQualquerCmei}</span></li>
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
                                    value={`${turma.cmei}|${turma.turma}`}
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
                    Convocar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Convocação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a convocar <span className="font-semibold">{crianca.nome}</span> para a vaga selecionada.
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
                        "Confirmar Convocação"
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