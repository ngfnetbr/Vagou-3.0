"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, ArrowLeft, School } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupedAvailableTurmas } from "@/hooks/use-grouped-available-turmas";
import { AvailableTurma } from "@/hooks/use-all-available-turmas";
import { Badge } from "@/components/ui/badge";

interface CmeiTurmaSelectorProps {
  value: string; // cmei_id|turma_id|cmei_nome|turma_nome
  onChange: (value: string) => void;
  disabled: boolean;
}

const CmeiTurmaSelector: React.FC<CmeiTurmaSelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedCmeiName, setSelectedCmeiName] = React.useState<string | null>(null);
  const { groupedTurmas, allAvailableTurmas, isLoading } = useGroupedAvailableTurmas();

  const selectedVaga = React.useMemo(() => {
    if (!value) return null;
    const parts = value.split('|');
    if (parts.length !== 4) return null;
    return {
        cmei_id: parts[0],
        turma_id: parts[1],
        cmei: parts[2],
        turma: parts[3],
    };
  }, [value]);

  const handleSelectTurma = (vaga: AvailableTurma) => {
    const newValue = `${vaga.cmei_id}|${vaga.turma_id}|${vaga.cmei}|${vaga.turma}`;
    onChange(newValue);
    setOpen(false);
    setSelectedCmeiName(null); // Reseta a visualização
  };
  
  const handleSelectCmei = (cmeiName: string) => {
    setSelectedCmeiName(cmeiName);
  };
  
  const handleBack = () => {
    setSelectedCmeiName(null);
  };

  const displayValue = selectedVaga 
    ? `${selectedVaga.cmei} - ${selectedVaga.turma}` 
    : "Selecione a Turma";
    
  const cmeiNames = Object.keys(groupedTurmas);
  const currentTurmas = selectedCmeiName ? groupedTurmas[selectedCmeiName] : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading || allAvailableTurmas.length === 0}
        >
          <span className="truncate">{displayValue}</span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        // Usando a variável do Radix para garantir que a largura seja exatamente a do trigger
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        side="bottom" 
      >
        {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando vagas...
            </div>
        ) : allAvailableTurmas.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhuma vaga disponível.
          </div>
        ) : (
          <ScrollArea className="h-auto max-h-[50vh]">
            <div className="p-1">
              {selectedCmeiName ? (
                // --- Etapa 2: Seleção da Turma ---
                <div className="space-y-2">
                    <div className="flex items-center p-2 border-b border-border sticky top-0 bg-card z-10">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-sm truncate">{selectedCmeiName}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1">
                        {currentTurmas.map((vaga) => {
                            const vagaValue = `${vaga.cmei_id}|${vaga.turma_id}|${vaga.cmei}|${vaga.turma}`;
                            const isSelected = value === vagaValue;
                            
                            return (
                                <div
                                    key={vaga.turma_id}
                                    onClick={() => handleSelectTurma(vaga)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-md text-sm cursor-pointer transition-colors border",
                                        isSelected 
                                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                                            : "hover:bg-accent border-transparent bg-background"
                                    )}
                                >
                                    <div className="flex flex-col items-start">
                                        <span>{vaga.turma}</span>
                                        <span className={cn("text-xs", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>Vagas: {vaga.vagas}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
              ) : (
                // --- Etapa 1: Seleção do CMEI ---
                <div className="space-y-1 p-1">
                    {cmeiNames.map((cmeiName) => {
                        const totalVagas = groupedTurmas[cmeiName].reduce((sum, t) => sum + t.vagas, 0);
                        
                        return (
                            <div
                                key={cmeiName}
                                onClick={() => handleSelectCmei(cmeiName)}
                                className="flex items-center justify-between p-3 rounded-md text-sm cursor-pointer transition-colors hover:bg-muted"
                            >
                                <div className="flex items-center gap-2">
                                    <School className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{cmeiName}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {totalVagas} vagas
                                </Badge>
                            </div>
                        );
                    })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CmeiTurmaSelector;