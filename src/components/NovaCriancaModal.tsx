import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Inscricao from "@/pages/Inscricao";

const NovaCriancaModalContent = () => {
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> {/* Ajustado para ser maior e com scroll */}
      <DialogHeader>
        {/* Removido o DialogTitle e DialogDescription */}
        {/* <DialogTitle>Registrar Nova Criança</DialogTitle>
        <DialogDescription>
          Preencha os dados para realizar a inscrição de uma nova criança no sistema.
        </DialogDescription> */}
      </DialogHeader>
      <Inscricao />
    </DialogContent>
  );
};

export default NovaCriancaModalContent;