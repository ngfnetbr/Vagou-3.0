"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";

// Esquema de validação com Zod para Nova Turma
const novaTurmaSchema = z.object({
  cmei: z.string().min(1, "O CMEI é obrigatório."),
  turmaBaseId: z.string().min(1, "O modelo de turma é obrigatório."),
  nome: z.string().min(1, "O nome da turma é obrigatório (ex: Manhã, Tarde)."),
  capacidade: z.coerce.number().min(1, "A capacidade deve ser no mínimo 1."),
  sala: z.enum(["A", "B", "C", "D"], { message: "Selecione a sala." }), // Alterado de 'turno' para 'sala'
});

export type NovaTurmaFormData = z.infer<typeof novaTurmaSchema>;

interface NovaTurmaModalProps {
  initialData?: NovaTurmaFormData & { id?: number };
  onSave: (data: NovaTurmaFormData & { id?: number }) => void;
  onClose: () => void;
  // Dados mockados para seleção
  cmeiOptions: { value: string; label: string }[];
  turmaBaseOptions: { id: number; nome: string }[];
}

const NovaTurmaModal = ({ initialData, onSave, onClose, cmeiOptions, turmaBaseOptions }: NovaTurmaModalProps) => {
  const form = useForm<NovaTurmaFormData>({
    resolver: zodResolver(novaTurmaSchema),
    defaultValues: initialData || {
      cmei: "",
      turmaBaseId: "",
      nome: "",
      capacidade: 0,
      sala: "A", // Valor padrão alterado
    },
  });

  const onSubmit = (values: NovaTurmaFormData) => {
    onSave({ ...values, id: initialData?.id });
  };

  // Se estiver em modo de edição, o nome da turma é preenchido automaticamente
  const isEditing = !!initialData?.id;

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
            name="cmei"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CMEI *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o CMEI" />
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
              name="turmaBaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo de Turma (Faixa Etária) *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
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
              name="sala" // Alterado de 'turno' para 'sala'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a sala" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Salvar Alterações" : "Cadastrar Turma"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default NovaTurmaModal;