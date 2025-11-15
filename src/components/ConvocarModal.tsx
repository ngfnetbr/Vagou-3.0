import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crianca } from "@/integrations/supabase/types";
import { useCMEIs, useTurmasByCmei } from "@/hooks/use-cmeis";
import { useCriancas } from "@/hooks/use-criancas";
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface ConvocarModalProps {
    crianca: Crianca;
    onClose: () => void;
}

// Define o esquema de validação
const convocarSchema = z.object({
    cmei_id: z.string().uuid({ message: "Selecione um CMEI válido." }),
    turma_id: z.string().uuid({ message: "Selecione uma Turma válida." }),
    deadline_dias: z.coerce.number().min(1, "O prazo deve ser de pelo menos 1 dia."),
});

type ConvocarFormData = z.infer<typeof convocarSchema>;

const ConvocarModal = ({ crianca, onClose }: ConvocarModalProps) => {
    const { cmeis, isLoading: isLoadingCmeis } = useCMEIs();
    const { convocarCrianca, isConvoking } = useCriancas();
    
    const [selectedCmeiId, setSelectedCmeiId] = useState<string | undefined>(crianca.cmei_atual_id);
    
    // Busca turmas dinamicamente
    const { data: turmas, isLoading: isLoadingTurmas } = useTurmasByCmei(selectedCmeiId);

    const form = useForm<ConvocarFormData>({
        resolver: zodResolver(convocarSchema),
        defaultValues: {
            cmei_id: crianca.cmei_atual_id || "",
            turma_id: crianca.turma_atual_id || "",
            deadline_dias: 7, // Prazo padrão de 7 dias
        },
    });
    
    // Atualiza o estado local quando o CMEI é selecionado no formulário
    const handleCmeiChange = (value: string) => {
        setSelectedCmeiId(value);
        form.setValue('cmei_id', value);
        form.setValue('turma_id', ''); // Resetar turma ao mudar CMEI
    };
    
    const selectedCmei = useMemo(() => {
        return (cmeis || []).find(c => c.id === selectedCmeiId);
    }, [cmeis, selectedCmeiId]);
    
    const selectedTurma = useMemo(() => {
        return (turmas || []).find(t => t.id === form.watch('turma_id'));
    }, [turmas, form.watch('turma_id')]);

    const onSubmit = async (values: ConvocarFormData) => {
        if (!selectedCmei || !selectedTurma) {
            toast.error("Erro de seleção", { description: "CMEI ou Turma não encontrados." });
            return;
        }
        
        try {
            // Calcula o prazo final
            const deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + values.deadline_dias);
            const deadlineString = format(deadlineDate, 'yyyy-MM-dd');
            
            await convocarCrianca({
                criancaId: crianca.id,
                data: {
                    cmei_id: values.cmei_id,
                    turma_id: values.turma_id,
                },
                cmeiNome: selectedCmei.nome,
                turmaNome: selectedTurma.nome,
                deadline: deadlineString,
            });
            
            onClose();
        } catch (e) {
            // Erro tratado pelo hook useCriancas
        }
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{crianca.status === 'Convocado' ? 'Reconvocar' : 'Convocar'} Criança</DialogTitle>
                <DialogDescription>
                    Selecione o CMEI e a turma para a qual <span className="font-semibold">{crianca.nome}</span> será convocada.
                </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    
                    {/* Seleção de CMEI */}
                    <FormField
                        control={form.control}
                        name="cmei_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CMEI de Convocação</FormLabel>
                                <Select onValueChange={handleCmeiChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger disabled={isLoadingCmeis || isConvoking}>
                                            <SelectValue placeholder="Selecione o CMEI" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(cmeis || []).map((cmei) => (
                                            <SelectItem key={cmei.id} value={cmei.id}>
                                                {cmei.nome} ({cmei.ocupacao}/{cmei.capacidade})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {/* Seleção de Turma */}
                    <FormField
                        control={form.control}
                        name="turma_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Turma de Convocação</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger disabled={!selectedCmeiId || isLoadingTurmas || isConvoking}>
                                            <SelectValue placeholder="Selecione a Turma" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isLoadingTurmas ? (
                                            <SelectItem value="loading" disabled>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando turmas...
                                            </SelectItem>
                                        ) : (turmas || []).length > 0 ? (
                                            (turmas || []).map((turma) => (
                                                <SelectItem key={turma.id} value={turma.id}>
                                                    {turma.nome} ({turma.ocupacao}/{turma.capacidade})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>Nenhuma turma disponível</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {/* Prazo de Resposta */}
                    <FormField
                        control={form.control}
                        name="deadline_dias"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prazo de Resposta (dias)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="Ex: 7" 
                                        {...field} 
                                        onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} 
                                        disabled={isConvoking}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isConvoking}>
                        {isConvoking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : crianca.status === 'Convocado' ? (
                            'Reconvocar'
                        ) : (
                            'Convocar Criança'
                        )}
                    </Button>
                </form>
            </Form>
        </DialogContent>
    );
};

export default ConvocarModal;