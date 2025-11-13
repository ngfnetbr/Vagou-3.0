"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns"; // Importando parse e isValid
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input"; // Importando o componente Input

interface DatePickerProps {
  value?: string; // Espera uma string no formato "YYYY-MM-DD"
  onChange: (dateString: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", disabled }: DatePickerProps) {
  // Converte a string "YYYY-MM-DD" para um objeto Date.
  const date = value ? new Date(value + 'T00:00:00') : undefined; 
  const [open, setOpen] = React.useState(false); // Estado para controlar a abertura do popover
  // Estado interno para o valor do input de texto
  const [inputValue, setInputValue] = React.useState(date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "");

  // Sincroniza o inputValue com o valor externo (prop 'value')
  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, "dd/MM/yyyy", { locale: ptBR }));
    } else if (value === "") { // Se o valor externo for explicitamente limpo
      setInputValue("");
    }
  }, [date, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    // Tenta analisar a data conforme o usuário digita
    // Esta é uma análise básica. Para uma entrada mais robusta, considere uma biblioteca de máscara de entrada.
    const parsedDate = parse(text, "dd/MM/yyyy", new Date(), { locale: ptBR });

    // Se a data analisada for válida e a string de entrada corresponder ao formato esperado, atualiza o valor do formulário
    if (isValid(parsedDate) && format(parsedDate, "dd/MM/yyyy", { locale: ptBR }) === text) {
      onChange(format(parsedDate, "yyyy-MM-dd"));
      // Não fecha o popover automaticamente ao digitar, o usuário pode querer corrigir
    } else if (text === "") {
      onChange(""); // Limpa a data se o input estiver vazio
    }
    // Para entradas parciais ou inválidas, não chamamos onChange para evitar invalidar o estado do formulário prematuramente.
  };

  const handleDateSelect = (selectedDate?: Date) => {
    if (selectedDate) {
      const formattedForForm = format(selectedDate, "yyyy-MM-dd");
      onChange(formattedForForm);
      setInputValue(format(selectedDate, "dd/MM/yyyy", { locale: ptBR }));
      setOpen(false); // Fecha o popover após a seleção
    } else {
      onChange(""); // Limpa a data se nada for selecionado
      setInputValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex items-center"> {/* Wrapper para o input e o ícone */}
        <PopoverTrigger asChild>
          <Input
            id="date-input"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            className={cn(
              "w-full pr-10", // Adiciona padding-right para o ícone
              !date && "text-muted-foreground",
              "hover:bg-primary/10 hover:text-primary" // Mantém os estilos de hover
            )}
            disabled={disabled}
          />
        </PopoverTrigger>
        <Button
          variant="ghost"
          className="absolute right-0 top-0 h-full px-3 py-2 rounded-l-none"
          onClick={() => setOpen((prev) => !prev)} // Alterna o calendário ao clicar no ícone
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </Button>
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={ptBR} // Define o idioma para Português do Brasil
        />
      </PopoverContent>
    </Popover>
  );
}