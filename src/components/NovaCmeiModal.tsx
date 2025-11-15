"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, X, Trash2, Loader2 } from "lucide-react"; // Importando Loader2
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
import { useCMEIs, CmeiFormData } from "@/hooks/use-cmeis"; // Importar hook e tipagem
import { toast } from "sonner"; // Importando toast

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
  latitude: z.string().optional().or(z.literal('')),
  longitude: z.string().optional().or(z.literal('')),
  telefone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /^\(\d{2}\) \d \d{4}-\d{4}$/.test(val), "Telefone inválido. Formato esperado: (00) 9 0000-0000."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  diretor: z.string().optional().or(z.literal('')),
  coordenador: z.string().optional().or(z.literal('')),
});

type CmeiFormInput = z.infer<typeof cmeiSchema>;

interface NovaCmeiModalProps {
  initialData?: CmeiFormInput & { id?: string }; // ID agora é string (UUID)
  onClose: () => void;
}

const NovaCmeiModal = ({ initialData, onClose }: NovaCmeiModalProps) => {
  const { createCmei, updateCmei, deleteCmei, isCreating, isUpdating, isDeleting } = useCMEIs();
  
  const form = useForm<CmeiFormInput>({
    resolver: zodResolver(cmeiSchema),
    defaultValues: initialData || {
      nome: "",
      endereco: "",
      latitude: "",
      longitude: "",
      telefone: "",
      email: "",
      diretor: "",
      coordenador: "",
    },
  });

  const onSubmit = async (values: CmeiFormInput) => {
    // Usamos CmeiFormInput, que é o tipo retornado pelo formulário, e o useCMEIs lida com a filtragem de campos vazios.
    const dataToSave = values; 
    
    if (initialData?.id) {
      // O updateCmei espera CmeiFormData, que é Omit<Cmei, ...>. CmeiFormInput é compatível.
      await updateCmei({ id: initialData.id, data: dataToSave as CmeiFormData });
    } else {
      await createCmei(dataToSave as CmeiFormData);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (initialData?.id) {
      try {
        await deleteCmei(initialData.id);
        onClose();
      } catch (e: any) {
        // Exibe o erro de integridade retornado pelo hook
        toast.error("Falha na Exclusão", {
          description: e.message,
        });
      }
    }
  };

  const isEditing = !!initialData?.id;
  const isPending = isCreating || isUpdating || isDeleting;

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar CMEI" : "Novo CMEI"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Atualize as informações do CMEI." : "Preencha os dados para cadastrar um novo CMEI."}
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
                  <Input placeholder="Ex: CMEI Centro" {...field} disabled={isPending} />
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
                  <Input placeholder="Ex: Rua das Flores, 123" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input placeholder="-23.4567" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input placeholder="-46.1234" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 9 0000-0000"
                      {...field}
                      value={formatPhone(field.value || '')}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        field.onChange(formatted);
                      }}
                      disabled={isPending}
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
                    <Input type="email" placeholder="email@cmei.com.br" {...field} disabled={isPending} />
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
                    <Input placeholder="Nome do(a) diretor(a)" {...field} disabled={isPending} />
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
                    <Input placeholder="Nome do(a) coordenador(a)" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter className="pt-4 flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir CMEI
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o CMEI 
                      <span className="font-semibold"> {initialData?.nome} </span>
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
                {isEditing ? "Salvar Alterações" : "Cadastrar CMEI"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default NovaCmeiModal;