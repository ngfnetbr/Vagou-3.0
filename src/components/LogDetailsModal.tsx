"use client";

import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { HistoricoEntry } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";

interface LogDetailsModalProps {
  log: HistoricoEntry & { timestamp: string; tipo: string };
}

const LogDetailsModal = ({ log }: LogDetailsModalProps) => {
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <DialogTitle>Detalhes do Registro de Ação</DialogTitle>
        </div>
        <DialogDescription>
          Informações completas sobre a ação registrada no sistema.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="text-muted-foreground">Data/Hora</p>
                <p className="font-medium">{log.timestamp}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Usuário</p>
                <p className="font-medium">{log.usuario}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Ação Principal</p>
                <p className="font-medium text-primary">{log.acao}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Tipo de Log</p>
                <p className="font-medium capitalize">{log.tipo}</p>
            </div>
        </div>
        
        <Separator />
        
        <div>
            <p className="text-lg font-semibold mb-2">Detalhes Completos</p>
            <div className="p-4 bg-muted rounded-lg border border-border whitespace-pre-wrap break-words">
                <p className="text-sm text-foreground">{log.detalhes}</p>
            </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default LogDetailsModal;