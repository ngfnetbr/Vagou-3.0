"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, X, Trash2, Loader2 } from "lucide-react";
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
import { useTurmasBase } from "@/hooks/use-turmas-base"; // Importando o novo hook

// Esquema de validação com Zod para Turma Base
const turmaBaseSchema = z.object({
  nome: z.string().min(1, "Nome da turma é obrigatório."),
  idadeMinima: z.coerce.number().min(0, "Idade mínima deve ser 0 ou maior."),
  idadeMaxima: z.coerce.number().min(0, "Idade máxima deve ser 0 ou maior."),
  descricao: z.string().optional().or(z.literal('')),
}).refine(data => data.idadeMaxima >= data.idadeMinima, {
  message: "Idade máxima não pode ser menor que a idade mínima.",
  path: ["idadeMaxima"],
});

export type TurmaBaseFormInput = z.infer<typeof turmaBaseSchema>;

interface TurmaBaseModalProps {
  initialData?: TurmaBaseFormInput & { id?: number }; // Inclui id para edição
  onClose: () => void;
}

const TurmaBaseModal = ({ initialData, onClose }: TurmaBaseModalProps) => {
  const { createTurmaBase, updateTurmaBase, deleteTurmaBase, isCreating, isUpdating, isDeleting } = useTurmasBase();
  
  const form = useForm<TurmaBaseFormInput>({
    resolver: zodResolver(turmaBaseSchema),
    defaultValues: initialData || {
      nome: "",
      idadeMinima: 0,
      idadeMaxima: 0,
      descricao: "",
    },
  });

  const onSubmit = async (values: TurmaBaseFormInput) => {
    const dataToSave = {
      nome: values.nome,
      idade_minima_meses: values.idadeMinima,
      idade_maxima_meses: values.idadeMaxima,
      descricao: values.descricao,
    };
    
    if (initialData?.id) {
      await updateTurmaBase({ id: initialData.id, data: dataToSave });
    } else {
      await createTurmaBase(dataToSave);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (initialData?.id) {
      await deleteTurmaBase(initialData.id);
      onClose();
    }
  };

  const isEditing = !!initialData?.id;
  const isPending = isCreating || isUpdating || isDeleting;

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Turma Base" : "Nova Turma Base"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Atualize as informações da turma base." : "Preencha os dados para cadastrar um novo modelo de turma."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Turma *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Maternal III" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="idadeMinima"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idade Mínima (meses)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idadeMaxima"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idade Máxima (meses)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="11" 
                      {...field} 
                      onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da Faixa Etária</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 1 a 2 anos" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="pt-4 flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            {initialData && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Turma
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma base 
                      <span className="font-semibold"> {initialData.nome} </span>
                      e removerá todos os dados associados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
                      {isDeleting ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex w-full sm:w-auto gap-2 mt-2 sm:mt-0">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none" disabled={isPending}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Salvar Alterações" : "Cadastrar Turma"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default TurmaBaseModal;