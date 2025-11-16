import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useMassActions } from "@/hooks/use-mass-actions";
import { Crianca } from "@/integrations/supabase/types";

interface StatusMassaModalProps {
    selectedIds: string[]; // Recebe os IDs selecionados
    onClose: () => void;
}

const statusOptions: { value: Crianca['status'], label: string }[] = [
    { value: "Desistente", label: "Desistente" },
    { value: "Recusada", label: "Recusada" },
    { value: "Fila de Espera", label: "Fim de Fila (Penalidade)" }, // Usamos Fila de Espera, mas o API aplica a penalidade
    { value: "Remanejamento Solicitado", label: "Remanejamento Solicitado" },
];

const StatusMassaModal = ({ selectedIds, onClose }: StatusMassaModalProps) => {
    const { massStatusUpdate, isMassStatusUpdating } = useMassActions();
    
    const [selectedStatus, setSelectedStatus] = useState<Crianca['status'] | ''>("");
    const [justificativa, setJustificativa] = useState("");
    
    const isProcessing = isMassStatusUpdating;

    const handleConfirm = async () => {
        if (!selectedStatus) {
            toast.error("Selecione o novo status.");
            return;
        }
        if (justificativa.length < 10) {
            toast.error("A justificativa deve ter pelo menos 10 caracteres.");
            return;
        }
        
        try {
            await massStatusUpdate({
                criancaIds: selectedIds,
                status: selectedStatus as Crianca['status'],
                justificativa,
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
                    <Trash2 className="h-6 w-6 text-destructive" />
                    <DialogTitle>Mudar Status em Massa</DialogTitle>
                </div>
                <DialogDescription>
                    Altere o status de <span className="font-semibold">{selectedIds.length} crianças</span> e forneça uma justificativa.
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="novo-status">Novo Status *</Label>
                    <Select onValueChange={(value) => setSelectedStatus(value as Crianca['status'])} value={selectedStatus} disabled={isProcessing}>
                        <SelectTrigger id="novo-status">
                            <SelectValue placeholder="Selecione o Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="justificativa">Justificativa *</Label>
                    <Textarea 
                        id="justificativa"
                        placeholder="Descreva o motivo da mudança de status (mínimo 10 caracteres)"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
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
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleConfirm}
                    disabled={isProcessing || !selectedStatus || justificativa.length < 10}
                >
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Confirmar Mudança
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default StatusMassaModal;