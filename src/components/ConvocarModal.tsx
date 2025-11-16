import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crianca, ConvocationData } from "@/integrations/supabase/types";
import { useCriancas, useAvailableTurmas } from "@/hooks/use-criancas";
import { useMemo } from "react";
import { Loader2, Bell, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, addDays } from "date-fns";
import { useConfiguracoes } from "@/hooks/use-configuracoes";
import { useAllTurmasByCmei } from "@/hooks/use-all-turmas-by-cmei"; // NOVO HOOK

interface ConvocarModalProps {
    crianca: Crianca;
    onClose: () => void;
}

// Define o esquema de validação
const convocarSchema = z.object({
    // O valor do select será uma string combinada: "cmei_id|turma_id|cmei_nome|turma_nome"
    vagaSelecionada: z.string().min(1, "Selecione uma vaga disponível."),
    deadline_dias: z.coerce.number().min(1, "O prazo deve ser de pelo menos 1 dia."),
});

type ConvocarFormData = z.infer<typeof convocarSchema>;

const ConvocarModal = ({ crianca, onClose }: ConvocarModalProps) => {
    const { convocarCrianca, isConvoking } = useCriancas();
    const { config, isLoading: isLoadingConfig } = useConfiguracoes();
    
    const isRemanejamento = crianca.status === 'Remanejamento Solicitado';
    
    // NOVO: Se for remanejamento, buscamos TODAS as turmas do CMEI de destino (sem filtro de idade)
    const { data: allCmeiTurmas, isLoading: isLoadingAllTurmas } = useAllTurmasByCmei(
        isRemanejamento ? crianca.cmei_remanejamento_id : undefined
    );
    
    // Se NÃO for remanejamento, usamos o hook original que filtra por vagas disponíveis e preferências
    const { data: availableTurmas, isLoading: isLoadingAvailable } = useAvailableTurmas(crianca.id);

    // Define a lista de turmas a ser usada no Select
    const turmasToDisplay = isRemanejamento ? allCmeiTurmas : availableTurmas;
    const isLoadingData = isLoadingConfig || isLoadingAllTurmas || isLoadingAvailable;

    const form = useForm<ConvocarFormData>({
        resolver: zodResolver(convocarSchema),
        defaultValues: {
            vagaSelecionada: "",
            deadline_dias: config?.prazo_resposta_dias || 7, // Usa o prazo configurado
        },
        values: {
            vagaSelecionada: "",
            deadline_dias: config?.prazo_resposta_dias || 7,
        },
    });
    
    const onSubmit = async (values: ConvocarFormData) => {
        // values.vagaSelecionada: "cmei_id|turma_id|cmei_nome|turma_nome"
        const parts = values.vagaSelecionada.split('|');
        
        if (parts.length !== 4) {
            toast.error("Erro de seleção", { description: "Formato de vaga inválido." });
            return;
        }
        
        const [cmei_id, turma_id, cmei_nome, turma_nome] = parts;

        const convocationData: ConvocationData = { cmei_id, turma_id };
        
        try {
            // Calcula o prazo final
            const deadlineDate = addDays(new Date(), values.deadline_dias);
            const deadlineString = format(deadlineDate, 'yyyy-MM-dd');
            
            await convocarCrianca({
                criancaId: crianca.id,
                data: convocationData,
                cmeiNome: cmei_nome,
                turmaNome: turma_nome,
                deadline: deadlineString,
            });
            
            onClose();
        } catch (e) {
            // Erro tratado pelo hook useCriancas
        }
    };
    
    const isReconvocacao = crianca.status === 'Convocado';

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>
                    {isRemanejamento ? 'Convocar para Remanejamento' : isReconvocacao ? 'Reconvocar' : 'Convocar'} Criança
                </DialogTitle>
                <DialogDescription>
                    Selecione a vaga compatível para a qual <span className="font-semibold">{crianca.nome}</span> será convocada.
                </DialogDescription>
            </DialogHeader>
            
            {isRemanejamento ? (
                // Bloco específico para Remanejamento
                <div className="space-y-3 text-sm p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="font-semibold text-primary flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Solicitação de Remanejamento
                    </p>
                    <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="font-medium text-foreground">CMEI Atual:</span> {crianca.cmeiNome} ({crianca.turmaNome})
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="font-medium text-foreground">CMEI Desejado:</span> {crianca.cmeiRemanejamentoNome}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground italic pt-2 border-t border-primary/10">
                        A lista de vagas abaixo mostra todas as turmas do CMEI desejado, independentemente da faixa etária ou ocupação.
                    </p>
                </div>
            ) : (
                // Bloco para Fila de Espera normal (Preferências)
                <div className="space-y-2 text-sm p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="font-semibold text-primary">Preferências da Criança:</p>
                    <p className="text-muted-foreground">
                        1ª Opção: {crianca.cmei1_preferencia}
                        {crianca.cmei2_preferencia && `, 2ª Opção: ${crianca.cmei2_preferencia}`}
                    </p>
                    <p className="text-muted-foreground">
                        Aceita qualquer CMEI: {crianca.aceita_qualquer_cmei ? 'Sim' : 'Não'}
                    </p>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    
                    {/* Seleção de Vaga (CMEI + Turma) */}
                    <FormField
                        control={form.control}
                        name="vagaSelecionada"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vaga Disponível *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger disabled={isLoadingData || isConvoking}>
                                            <SelectValue placeholder={isLoadingData ? "Buscando vagas compatíveis..." : "Selecione a Vaga"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent side="bottom" position="popper">
                                        {isLoadingData ? (
                                            <SelectItem value="loading" disabled>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
                                            </SelectItem>
                                        ) : turmasToDisplay && turmasToDisplay.length > 0 ? (
                                            turmasToDisplay.map((vaga, index) => {
                                                // Se for remanejamento, não precisamos de destaque de preferência
                                                const isPreferred = !isRemanejamento && (crianca.cmei1_preferencia === vaga.cmei || crianca.cmei2_preferencia === vaga.cmei);
                                                
                                                // Formatação do texto de vagas
                                                const vagasText = `(${vaga.vagas} vagas)`;
                                                    
                                                const isLotada = vaga.vagas <= 0;
                                                
                                                const label = isRemanejamento 
                                                    ? `${vaga.turma} ${vagasText}`
                                                    : `${vaga.cmei} - ${vaga.turma} ${vagasText}`;
                                                
                                                // Valor combinado: cmei_id|turma_id|cmei_nome|turma_nome
                                                const value = `${vaga.cmei_id}|${vaga.turma_id}|${vaga.cmei}|${vaga.turma}`;
                                                
                                                return (
                                                    <SelectItem 
                                                        key={index} 
                                                        value={value}
                                                        className={isPreferred ? 'font-semibold text-primary' : isLotada ? 'text-destructive' : ''}
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

                    <Button type="submit" className="w-full" disabled={isConvoking || !form.formState.isValid || (turmasToDisplay?.length === 0 && !isLoadingData)}>
                        {isConvoking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Bell className="mr-2 h-4 w-4" />
                        )}
                        {isRemanejamento ? 'Convocar para Remanejamento' : isReconvocacao ? 'Reconvocar Criança' : 'Convocar Criança'}
                    </Button>
                </form>
            </Form>
            <DialogFooter className="text-xs text-muted-foreground pt-2">
                A lista de vagas é filtrada automaticamente por compatibilidade de idade e {isRemanejamento ? 'CMEI de destino.' : 'preferências.'}
            </DialogFooter>
        </DialogContent>
    );
};

export default ConvocarModal;