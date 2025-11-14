import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Inscricao from "@/pages/Inscricao"; // Import Inscricao
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema"; // Import type from schema file
import { Crianca } from "@/integrations/supabase/criancas"; // Importação atualizada

interface NovaCriancaModalProps {
  onClose: () => void;
  initialData?: Crianca; // Data for editing
}

// Helper to map Crianca data structure (DB format) to InscricaoFormData (Form format)
const mapCriancaToFormData = (crianca: Crianca): InscricaoFormData => ({
  nomeCrianca: crianca.nome,
  dataNascimento: crianca.data_nascimento,
  sexo: crianca.sexo,
  programasSociais: crianca.programas_sociais ? 'sim' : 'nao',
  aceitaQualquerCmei: crianca.aceita_qualquer_cmei ? 'sim' : 'nao',
  cmei1: crianca.cmei1_preferencia,
  cmei2: crianca.cmei2_preferencia || '',
  nomeResponsavel: crianca.responsavel_nome,
  cpf: crianca.responsavel_cpf,
  telefone: crianca.responsavel_telefone,
  telefone2: crianca.responsavel_telefone, // Assuming only one phone is stored, using it for both
  email: crianca.responsavel_email || '',
  endereco: crianca.endereco || '',
  bairro: crianca.bairro || '',
  observacoes: crianca.observacoes || '',
});

const NovaCriancaModalContent = ({ onClose, initialData }: NovaCriancaModalProps) => {
  const isEditing = !!initialData;
  const defaultValues = isEditing ? mapCriancaToFormData(initialData) : undefined;

  const handleSuccess = () => {
    // This handles both successful submission and deletion (via onSuccess in Inscricao)
    onClose();
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEditing ? `Editar Criança: ${initialData.nome}` : "Registrar Nova Criança"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Atualize os dados cadastrais da criança." : "Preencha os dados para realizar a inscrição de uma nova criança no sistema."}
        </DialogDescription>
      </DialogHeader>
      {/* Pass onSuccess handler, isModal flag, initialData/id for editing, and onClose for cancellation */}
      <Inscricao 
        onSuccess={handleSuccess} 
        onCancel={onClose} // Passa a função de fechar para o botão Cancelar
        isModal={true} 
        initialData={defaultValues}
        criancaId={initialData?.id} // ID agora é string
      />
    </DialogContent>
  );
};

export default NovaCriancaModalContent;