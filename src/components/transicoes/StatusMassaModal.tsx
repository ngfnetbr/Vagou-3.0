import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { CriancaClassificada } from '@/hooks/use-transicoes';
import { Badge } from "@/components/ui/badge";

interface StatusMassaModalProps {
    selectedIds: string[];
    onClose: () => void;
    onConfirmMassStatusUpdate: (ids: string[], status: CriancaClassificada['status'], justificativa: string) => void;
    // Novas props para customização
    allowedStatus?: CriancaClassificada['status'][];
    actionTitle?: string;
    actionDescription?: string;
}

const StatusMassaModal = ({ 
    selectedIds, 
    onClose, 
    onConfirmMassStatusUpdate,
    allowedStatus = ['Desistente'], // Default para status de saída
    actionTitle = "Mudar Status em Massa",
    actionDescription = "Confirme a conclusão do ciclo para as crianças selecionadas.",
}: StatusMassaModalProps) => {
    const [isPending, setIsPending] = useState(false);
    
    // No contexto de 'Concluinte', o status de saída é 'Desistente'
    const statusToApply: CriancaClassificada['status'] = allowedStatus[0] || 'Desistente'; 
    const justificativaPadrao = "Conclusão de ciclo (formação) - Ação de Transição Anual.";

    const handleConfirm = () => {
        setIsPending(true);
        
        // Chama a função de planejamento com a justificativa padrão
        onConfirmMassStatusUpdate(selectedIds, statusToApply, justificativaPadrao);
        
        toast.success(`${selectedIds.length} crianças marcadas para ${statusToApply}.`, {
            description: "A mudança será aplicada ao executar a transição."
        });
        
        setIsPending(false);
        onClose();
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{actionTitle}</DialogTitle>
                <DialogDescription>
                    {actionDescription}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                    Você está confirmando a conclusão do ciclo para <span className="font-semibold text-primary">{selectedIds.length} crianças</span>. Elas serão marcadas como <Badge variant="destructive" className="bg-destructive/20 text-destructive">Saída ({statusToApply})</Badge> e removidas das turmas ativas.
                </p>
                <p className="text-xs text-muted-foreground italic">
                    Justificativa automática: {justificativaPadrao}
                </p>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={isPending}>
                    Cancelar
                </Button>
                <Button onClick={handleConfirm} disabled={isPending}>
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {isPending ? "Planejando..." : `Confirmar Conclusão (${selectedIds.length})`}
                </Button>
            </div>
        </DialogContent>
    );
};

export default StatusMassaModal;