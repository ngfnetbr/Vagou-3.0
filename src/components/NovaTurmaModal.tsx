"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Loader2 } from "lucide-react";
import { useCMEIs } from "@/hooks/use-cmeis";
import { useTurmasBase } from "@/hooks/use-turmas-base";
import { useTurmas, TurmaFormData } from "@/hooks/use-turmas";
import { toast } from "sonner";

// Esquema de validação com Zod para Nova Turma
const novaTurmaSchema = z.object({
  cmei_id: z.string().uuid("O CMEI é obrigatório.").min(1, "O CMEI é obrigatório."),
  turma_base_id: z.coerce.number().min(1, "O modelo de turma é obrigatório."),
  capacidade: z.coerce.number().min(1, "A capacidade deve ser no mínimo 1."),
  sala: z.enum(["A", "B", "C", "D", "E", "F", "G", "H"], { message: "Selecione a sala." }), // Expandindo opções de sala
  nome: z.string().optional(), // O nome será gerado no onSubmit
});

export type NovaTurmaFormInput = z.infer<typeof novaTurmaSchema>;

interface NovaTurmaModalProps {
  initialData?: NovaTurmaFormInput & { id?: string }; // ID agora é string (UUID)
  onClose: () => void;
}

const NovaTurmaModal = ({ initialData, onClose }: NovaTurmaModalProps) => {
  const { cmeis, isLoading: isLoadingCmeis } = useCMEIs();
  const { turmasBase, isLoading: isLoadingTurmasBase } = useTurmasBase();
  const { createTurma, updateTurma, isCreating, isUpdating } = useTurmas();

  const form = useForm<NovaTurmaFormInput>({
    resolver: zodResolver(novaTurmaSchema),
    defaultValues: initialData || {
      cmei_id: "",
      turma_base_id: 0,
      capacidade: 0,
      sala: "A",
      nome: "",
    },
  });

  const onSubmit = async (values: NovaTurmaFormInput) => {
    const baseTurma = turmasBase.find(t => t.id === values.turma_base_id);
    const cmei = cmeis.find(c => c.id === values.cmei_id);

    if (!baseTurma || !cmei) {
        toast.error("Erro de validação", { description: "CMEI ou Modelo de Turma não encontrado." });
        return;
    }
    
    // Gerar o nome completo da turma (ex: Maternal I - Sala A)
    const nomeCompleto = `${baseTurma.nome} - Sala ${values.sala}`;

    const dataToSave: TurmaFormData = {
        cmei_id: values.cmei_id,
        turma_base_id: values.turma_base_id,
        nome: nomeCompleto,
        capacidade: values.capacidade,
        sala: values.sala,
    };

    try {
        if (initialData?.id) {
            // Edição: Apenas capacidade e sala podem ser alterados (e o nome é recalculado)
            await updateTurma({ 
                id: initialData.id, 
                data: { 
                    capacidade: dataToSave.capacidade, 
                    sala: dataToSave.sala,
                    nome: dataToSave.nome,
                } 
            });
        } else {
            await createTurma(dataToSave);
        }
        onClose();
    } catch (e) {
        // Erro tratado pelo hook
    }
  };

  const isEditing = !!initialData?.id;
  const isPending = isCreating || isUpdating || isLoadingCmeis || isLoadingTurmasBase;

  const cmeiOptions = cmeis.map(c => ({ value: c.id, label: c.nome }));
  const turmaBaseOptions = turmasBase.map(t => ({ id: t.id, nome: t.nome }));

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Turma" : "Nova Turma"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Atualize os detalhes desta turma no CMEI." : "Crie uma nova turma em um CMEI específico."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="cmei_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CMEI *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing || isLoadingCmeis}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingCmeis ? "Carregando CMEIs..." : "Selecione o CMEI"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cmeiOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="turma_base_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo de Turma (Faixa Etária) *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))} 
                    value={String(field.value)} 
                    disabled={isEditing || isLoadingTurmasBase}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingTurmasBase ? "Carregando modelos..." : "Selecione o modelo"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {turmaBaseOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sala"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a sala" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(sala => (
                          <SelectItem key={sala} value={sala}>{sala}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="capacidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade Máxima de Alunos *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ex: 20" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "Salvar Alterações" : "Cadastrar Turma"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default NovaTurmaModal;