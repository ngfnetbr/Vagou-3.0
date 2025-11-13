import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Inscricao from "@/pages/Inscricao";
import { Crianca } from "@/lib/mock-data";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";

interface NovaCriancaModalProps {
  isEditing?: boolean;
  initialData?: Crianca;
  criancaId?: number;
  onSuccess?: () => void;
}

const mapCriancaToFormData = (crianca: Crianca): InscricaoFormData => ({
  nomeCrianca: crianca.nomeCrianca,
  dataNascimento: crianca.dataNascimento,
  sexo: crianca.sexo,
  programasSociais: crianca.programasSociais,
  aceitaQualquerCmei: crianca.aceitaQualquerCmei,
  cmei1: crianca.cmei1,
  cmei2: crianca.cmei2 || '',
  nomeResponsavel: crianca.nomeResponsavel,
  // Usando as propriedades corretas que agora estão em Crianca (herdadas de InscricaoFormData)
  cpf: crianca.cpf,
  telefone: crianca.telefone,
  telefone2: crianca.telefone2, 
  email: crianca.email || '',
  endereco: crianca.endereco || '',
  bairro: crianca.bairro || '',
  observacoes: crianca.observacoes || '',
});

export const NovaCriancaModal = ({ isEditing = false, initialData, criancaId, onSuccess }: NovaCriancaModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const initialFormData = initialData ? mapCriancaToFormData(initialData) : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? "outline" : "default"}>
          {isEditing ? (
            "Editar"
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nova Inscrição
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{isEditing ? `Editar Criança: ${initialData?.nomeCrianca}` : "Registrar Nova Criança"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados da criança e do responsável." : "Preencha o formulário para cadastrar uma nova criança na fila de espera."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto p-6 pt-0">
          <Inscricao 
            isModal 
            criancaId={criancaId}
            initialData={initialFormData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};