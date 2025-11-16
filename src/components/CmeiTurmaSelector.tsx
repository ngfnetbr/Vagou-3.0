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
import { AvailableTurma } from "@/hooks/use-all-available-turmas"; // Reutilizando a tipagem
import { Badge } from "@/components/ui/badge";

interface CmeiTurmaSelectorProps {
  value: string; // cmei_id|turma_id|cmei_nome|turma_nome
  onChange: (value: string) => void;
  disabled: boolean;
  availableTurmas: AvailableTurma[]; // Nova prop: lista de turmas disponíveis (já filtrada)
  isLoading: boolean; // Nova prop: estado de carregamento
}

// Interface para o agrupamento local
interface GroupedTurmas {
    [cmeiName: string]: AvailableTurma[];
}

const CmeiTurmaSelector: React.FC<CmeiTurmaSelectorProps> = ({
  value,
  onChange,
  disabled,
  availableTurmas,
  isLoading,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedCmeiName, setSelectedCmeiName] = React.useState<string | null>(null);

  // Agrupa as turmas recebidas por CMEI
  const { groupedTurmas, allAvailableTurmas } = React.useMemo(() => {
    const grouped = availableTurmas.reduce((acc, turma) => {
        if (!acc[turma.cmei]) {
            acc[turma.cmei] = [];
        }
        acc[turma.cmei].push(turma);
        return acc;
    }, {} as GroupedTurmas);
    
    return {
        groupedTurmas: grouped,
        allAvailableTurmas: availableTurmas,
    };
  }, [availableTurmas]);

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
        // Aumenta a largura máxima para acomodar 3 colunas
        className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" 
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
            <div className="p-0">
              {selectedCmeiName ? (
                // --- Etapa 2: Seleção da Turma (3 COLUNAS) ---
                <div className="space-y-2">
                    <div className="flex items-center p-2 border-b border-border sticky top-0 bg-card z-10">
                        <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-sm truncate">{selectedCmeiName}</span>
                    </div>
                    
                    {/* GRID DE 3 COLUNAS */}
                    <div className="grid grid-cols-3 gap-1 p-2">
                        {currentTurmas.map((vaga) => {
                            const vagaValue = `${vaga.cmei_id}|${vaga.turma_id}|${vaga.cmei}|${vaga.turma}`;
                            const isSelected = value === vagaValue;
                            const isLotada = vaga.vagas <= 0;
                            
                            return (
                                <div
                                    key={vaga.turma_id}
                                    onClick={() => handleSelectTurma(vaga)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-1.5 rounded-md text-xs cursor-pointer transition-colors border h-14", // Altura reduzida para h-14, padding para p-1.5
                                        isSelected 
                                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                                            : isLotada
                                            ? "bg-destructive/10 text-destructive border-destructive/30 cursor-not-allowed"
                                            : "hover:bg-accent/20 border-transparent bg-background"
                                    )}
                                    aria-disabled={isLotada}
                                >
                                    <span className="font-semibold text-center leading-tight text-xs">{vaga.turma}</span> {/* Fonte reduzida para text-xs */}
                                    <Badge 
                                        variant="secondary" 
                                        className={cn("mt-1 text-[9px] h-3.5 px-1.5", isSelected && "bg-primary-foreground text-primary hover:bg-primary-foreground", isLotada && "bg-destructive text-destructive-foreground hover:bg-destructive")} // Badge menor
                                    >
                                        {isLotada ? 'LOTADA' : `${vaga.vagas} vagas`}
                                    </Badge>
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