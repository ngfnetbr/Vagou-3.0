import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useMassActions } from "@/hooks/use-mass-actions";
import { useTurmas } from "@/hooks/use-turmas";
import { useCMEIs } from "@/hooks/use-cmeis";

interface RealocacaoMassaModalProps {
    selectedIds: string[]; // Recebe os IDs selecionados
    onClose: () => void;
}

const RealocacaoMassaModal = ({ selectedIds, onClose }: RealocacaoMassaModalProps) => {
    const { massRealocate, isMassRealocating } = useMassActions();
    const { turmas, isLoading: isLoadingTurmas } = useTurmas();
    const { cmeis, isLoading: isLoadingCmeis } = useCMEIs();
    
    const [selectedVaga, setSelectedVaga] = useState("");
    
    const isProcessing = isMassRealocating || isLoadingTurmas || isLoadingCmeis;

    const availableTurmas = useMemo(() => {
        if (!turmas || !cmeis) return [];
        
        const cmeiMap = new Map(cmeis.map(c => [c.id, c.nome]));
        
        return turmas.map(t => ({
            id: t.id,
            cmei_id: t.cmei_id,
            nome: `${t.nome} (${cmeiMap.get(t.cmei_id) || 'CMEI Desconhecido'})`,
            // Valor combinado: turma_id|cmei_id|turma_nome|cmei_nome
            value: `${t.id}|${t.cmei_id}|${t.nome}|${cmeiMap.get(t.cmei_id) || 'CMEI Desconhecido'}`,
        }));
    }, [turmas, cmeis]);

    const handleConfirm = async () => {
        if (!selectedVaga) {
            toast.error("Selecione a turma de destino.");
            return;
        }
        
        // Valor combinado: turma_id|cmei_id|turma_nome|cmei_nome
        const [turma_id, cmei_id, turma_nome, cmei_nome] = selectedVaga.split('|');
        
        if (!turma_id || !cmei_id) {
            toast.error("Erro de seleção. Tente novamente.");
            return;
        }
        
        try {
            await massRealocate({
                criancaIds: selectedIds,
                cmei_id,
                turma_id,
                cmeiNome: cmei_nome,
                turmaNome: turma_nome,
            });
            onClose();
        } catch (e) {
            // Erro tratado pelo hook
        }
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
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
                    <Select onValueChange={setSelectedVaga} value={selectedVaga} disabled={isProcessing}>
                        <SelectTrigger id="turma-destino">
                            <SelectValue placeholder={isLoadingTurmas ? "Carregando turmas..." : "Selecione a Turma"} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTurmas.map(turma => (
                                <SelectItem key={turma.id} value={turma.value}>
                                    {turma.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    Confirmar Realocação
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default RealocacaoMassaModal;