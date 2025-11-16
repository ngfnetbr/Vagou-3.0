import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useMassActions } from "@/hooks/use-mass-actions";
import { useGroupedAvailableTurmas } from "@/hooks/use-grouped-available-turmas";
import CmeiTurmaSelector from "../CmeiTurmaSelector"; // Importando o novo componente

interface RealocacaoMassaModalProps {
    selectedIds: string[]; // Recebe os IDs selecionados
    onClose: () => void;
    onConfirmMassRealocate: (criancaIds: string[], cmei_id: string, turma_id: string, cmei_nome: string, turma_nome: string) => void; // Função de planejamento atualizada
}

const RealocacaoMassaModal = ({ selectedIds, onClose, onConfirmMassRealocate }: RealocacaoMassaModalProps) => {
    // Mantemos o hook useMassActions apenas para o isPending (embora não seja usado para a ação real aqui)
    const { isMassRealocating } = useMassActions(); 
    const { isLoading: isLoadingTurmas } = useGroupedAvailableTurmas();
    
    const [selectedVaga, setSelectedVaga] = useState("");
    
    const isProcessing = isMassRealocating || isLoadingTurmas;

    const handleConfirm = () => {
        if (!selectedVaga) {
            toast.error("Selecione a turma de destino.");
            return;
        }
        
        // Valor combinado: cmei_id|turma_id|cmei_nome|turma_nome
        const parts = selectedVaga.split('|');
        
        if (parts.length !== 4) {
            toast.error("Erro de seleção. Tente novamente.");
            return;
        }
        
        const [cmei_id, turma_id, cmei_nome, turma_nome] = parts;
        
        if (!turma_id || !cmei_id) {
            toast.error("Erro de seleção. Tente novamente.");
            return;
        }
        
        // Chama a função de planejamento
        onConfirmMassRealocate(selectedIds, cmei_id, turma_id, cmei_nome, turma_nome);
        toast.success("Realocação em massa planejada!", {
            description: `${selectedIds.length} crianças marcadas para realocação para ${cmei_nome} - ${turma_nome}.`,
        });
        onClose();
    };

    return (
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <RotateCcw className="h-6 w-6 text-secondary" />
                    <DialogTitle>Realocação em Massa</DialogTitle>
                </div>
                <DialogDescription>
                    Mova <span className="font-semibold">{selectedIds.length} crianças</span> para uma nova turma.
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="turma-destino">Turma de Destino *</Label>
                    <CmeiTurmaSelector
                        value={selectedVaga}
                        onChange={setSelectedVaga}
                        disabled={isProcessing}
                    />
                </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button 
                    type="button" 
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    onClick={handleConfirm}
                    disabled={isProcessing || !selectedVaga}
                >
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Planejar Realocação
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default RealocacaoMassaModal;