"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

  const handleSelect = (vaga: AvailableTurma) => {
    const newValue = `${vaga.cmei_id}|${vaga.turma_id}|${vaga.cmei}|${vaga.turma}`;
    onChange(newValue);
    setOpen(false);
  };
  
  const displayValue = selectedVaga 
    ? `${selectedVaga.cmei} - ${selectedVaga.turma}` 
    : "Selecione a Turma";

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
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom" 
      >
        {/* A ScrollArea agora define a altura máxima e a rolagem */}
        <ScrollArea className="h-auto max-h-[70vh]">
          <div className="p-1">
            {isLoading ? (
                <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando vagas...
                </div>
            ) : allAvailableTurmas.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhuma vaga disponível.
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedTurmas).map(([cmeiName, turmas]) => (
                  <AccordionItem key={cmeiName} value={cmeiName} className="border-b">
                    <AccordionTrigger className="px-3 py-2 text-sm font-semibold hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span>{cmeiName}</span>
                        <Badge variant="secondary" className="text-xs">
                            {turmas.reduce((sum, t) => sum + t.vagas, 0)} vagas
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      {turmas.map((vaga) => {
                        const vagaValue = `${vaga.cmei_id}|${vaga.turma_id}|${vaga.cmei}|${vaga.turma}`;
                        const isSelected = value === vagaValue;
                        
                        return (
                          <div
                            key={vaga.turma_id}
                            onClick={() => handleSelect(vaga)}
                            className={cn(
                              "flex items-center justify-between p-2 pl-6 text-sm cursor-pointer hover:bg-accent/10",
                              isSelected && "bg-primary/10 text-primary font-medium"
                            )}
                          >
                            <div className="flex flex-col items-start">
                                <span>{vaga.turma}</span>
                                <span className="text-xs text-muted-foreground">Vagas: {vaga.vagas}</span>
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
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CmeiTurmaSelector;