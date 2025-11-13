"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, X } from "lucide-react";

// Função de máscara de telefone (copiada de Inscricao.tsx)
const formatPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, ""); // Remove tudo que não é dígito

  if (value.length > 11) {
    value = value.substring(0, 11); // Limita a 11 dígitos
  }

  let formattedValue = value;
  if (formattedValue.length > 0) {
    formattedValue = `(${formattedValue}`;
  }
  if (formattedValue.length > 3) { // Depois de (XX
    formattedValue = `${formattedValue.substring(0, 3)}) ${formattedValue.substring(3)}`;
  }
  if (formattedValue.length > 6 && formattedValue.charAt(6) !== ' ') { // Depois de (XX) X
    formattedValue = `${formattedValue.substring(0, 6)} ${formattedValue.substring(6)}`;
  }
  if (formattedValue.length > 11) { // Depois de (XX) X XXXX
    formattedValue = `${formattedValue.substring(0, 11)}-${formattedValue.substring(11)}`;
  }
  return formattedValue;
};

// Esquema de validação com Zod para CMEI
const cmeiSchema = z.object({
  nome: z.string().min(1, "Nome do CMEI é obrigatório."),
  endereco: z.string().min(1, "Endereço é obrigatório."),
  capacidade: z.coerce.number().min(1, "Capacidade deve ser um número positivo."),
  telefone: z
    .string()
    .min(1, "Telefone é obrigatório.")
    .regex(/^\(\d{2}\) \d \d{4}-\d{4}$/, "Telefone inválido. Formato esperado: (00) 9 0000-0000."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  diretor: z.string().optional().or(z.literal('')),
  coordenador: z.string().optional().or(z.literal('')),
  observacoes: z.string().optional().or(z.literal('')),
});

type CmeiFormData = z.infer<typeof cmeiSchema>;

interface NovaCmeiModalProps {
  initialData?: CmeiFormData & { id?: number }; // Inclui id para edição
  onSave: (data: CmeiFormData) => void;
  onClose: () => void;
}

const NovaCmeiModal = ({ initialData, onSave, onClose }: NovaCmeiModalProps) => {
  const form = useForm<CmeiFormData>({
    resolver: zodResolver(cmeiSchema),
    defaultValues: initialData || {
      nome: "",
      endereco: "",
      capacidade: 0,
      telefone: "",
      email: "",
      diretor: "",
      coordenador: "",
      observacoes: "",
    },
  });

  const onSubmit = (values: CmeiFormData) => {
    onSave(values);
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{initialData ? "Editar CMEI" : "Novo CMEI"}</DialogTitle>
        <DialogDescription>
          {initialData ? "Atualize as informações do CMEI." : "Preencha os dados para cadastrar um novo CMEI."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do CMEI *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: CMEI Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Rua das Flores, 123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="capacidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade Total *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 150" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 9 0000-0000"
                      {...field}
                      value={formatPhone(field.value)}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@cmei.com.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="diretor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diretor(a)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do(a) diretor(a)" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coordenador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordenador(a)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do(a) coordenador(a)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Informações adicionais sobre o CMEI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Save className="mr-2 h-4 w-4" />
              {initialData ? "Salvar Alterações" : "Cadastrar CMEI"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default NovaCmeiModal;