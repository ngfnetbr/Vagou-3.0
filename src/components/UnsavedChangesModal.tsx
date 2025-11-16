"use client";

import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndNavigate: () => Promise<void>;
  onDiscardAndNavigate: () => void;
  isSaving: boolean;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onSaveAndNavigate,
  onDiscardAndNavigate,
  isSaving,
}) => {
  if (!isOpen) return null;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-3 text-accent">
          <AlertTriangle className="h-6 w-6" />
          <DialogTitle className="text-xl">Alterações Não Salvas</DialogTitle>
        </div>
        <DialogDescription className="pt-2">
          Você tem alterações pendentes no planejamento de transição. Deseja salvar antes de sair?
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-2 py-2">
        <p className="text-sm font-medium text-foreground">
          Se você sair sem salvar, todas as alterações feitas desde o último carregamento serão perdidas.
        </p>
      </div>

      <DialogFooter className="pt-4 flex flex-col sm:flex-row sm:justify-between gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onDiscardAndNavigate} 
          disabled={isSaving}
          className="order-3 sm:order-1"
        >
          <X className="mr-2 h-4 w-4" />
          Sair sem Salvar
        </Button>
        
        <div className="flex gap-2 order-1 sm:order-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={onSaveAndNavigate} 
              disabled={isSaving}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar e Sair
            </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default UnsavedChangesModal;