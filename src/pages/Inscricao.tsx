import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Save, Loader2, Trash2 } from "lucide-react";
import { useCriancas } from "@/hooks/use-criancas";
import { formSchema, InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { CriancaDataForm } from "@/components/forms/CriancaDataForm";
import { ResponsavelDataForm } from "@/components/forms/ResponsavelDataForm";
import { EnderecoDataForm } from "@/components/forms/EnderecoDataForm";
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

interface InscricaoProps {
  onSuccess?: (data: InscricaoFormData) => void;
  onCancel?: () => void; // Novo prop para lidar com o cancelamento/fechamento
  isModal?: boolean;
  initialData?: InscricaoFormData; // Data for editing
  criancaId?: number; // ID of the child being edited
}

const Inscricao = ({ onSuccess, onCancel, isModal = false, initialData, criancaId }: InscricaoProps) => {
  const { addCrianca, isAdding, updateCrianca, isUpdating, deleteCrianca, isDeleting } = useCriancas();
  const isEditing = !!criancaId;

  const form = useForm<InscricaoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nomeCrianca: "",
      dataNascimento: "",
      sexo: "feminino",
      programasSociais: "nao",
      aceitaQualquerCmei: "nao",
      cmei1: "",
      cmei2: "",
      nomeResponsavel: "",
      cpf: "",
      telefone: "",
      telefone2: "",
      email: "",
      endereco: "",
      bairro: "",
      observacoes: "",
    },
  });

  const cmeiOptions = [
    { value: "CMEI Centro", label: "CMEI Centro" },
    { value: "CMEI Norte", label: "CMEI Norte" },
    { value: "CMEI Sul", label: "CMEI Sul" },
    { value: "CMEI Leste", label: "CMEI Leste" },
  ];

  const selectedCmei1 = form.watch("cmei1");
  const filteredCmei2Options = cmeiOptions.filter(
    (cmei) => cmei.value !== selectedCmei1
  );

  // Tipando o parâmetro values explicitamente como InscricaoFormData
  const onSubmit = async (values: InscricaoFormData) => {
    // O ZodResolver garante que 'values' é InscricaoFormData se a validação passar.
    // Usamos a asserção de tipo para satisfazer o compilador TS.
    const dataToSubmit = values as InscricaoFormData; 

    if (onSuccess) {
      // Admin context: use mutation
      try {
        if (isEditing && criancaId) {
          // O erro 1 e 2 são corrigidos aqui, pois dataToSubmit é explicitamente InscricaoFormData
          await updateCrianca({ id: criancaId, data: dataToSubmit }); 
        } else {
          await addCrianca(dataToSubmit); 
        }
        onSuccess(values);
        if (!isEditing) {
          form.reset();
        }
      } catch (error) {
        // Error handled by useCriancas hook toast
      }
    } else {
      // Public context: placeholder for public submission logic
      toast.success("Inscrição realizada com sucesso!", {
        description: "Seu protocolo de inscrição será enviado por e-mail.",
      });
      form.reset();
    }
  };
  
  const handleDelete = async () => {
    if (criancaId) {
      await deleteCrianca(criancaId);
      if (onSuccess) {
        // O getValues() retorna o tipo correto, mas o cast é mantido aqui para garantir que o onSuccess receba o tipo completo, mesmo que o formulário esteja sendo resetado.
        onSuccess(form.getValues()); 
      }
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      form.reset();
    }
  };

  const isSubmitting = isAdding || isUpdating || isDeleting;

  return (
    <div className={isModal ? "p-0" : "container mx-auto px-4 py-6"}>
      <div className="max-w-4xl mx-auto">
        {!isModal && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Nova Inscrição para Vaga
            </h1>
            <p className="text-muted-foreground">
              Preencha o formulário abaixo para cadastrar a criança na fila de espera.
            </p>
          </div>
        )}
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <CriancaDataForm 
              cmeiOptions={cmeiOptions}
              filteredCmei2Options={filteredCmei2Options}
              selectedCmei1={selectedCmei1}
            />

            <ResponsavelDataForm />

            <EnderecoDataForm />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 pt-4">
              {isEditing && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      className="w-full sm:w-auto mt-2 sm:mt-0"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Criança
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a criança 
                        <span className="font-semibold"> {form.watch('nomeCrianca')} </span>
                        e todos os seus registros.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Excluindo..." : "Excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="flex w-full sm:w-auto gap-4 sm:ml-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 sm:flex-none" 
                  onClick={handleCancelClick}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 sm:flex-none bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? "Processando..." : (isEditing ? "Salvar Alterações" : "Cadastrar")}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default Inscricao;