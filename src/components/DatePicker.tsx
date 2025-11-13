"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
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
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  value?: string; // Espera uma string no formato "YYYY-MM-DD"
  onChange: (dateString: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", disabled }: DatePickerProps) {
  const date = value ? new Date(value + 'T00:00:00') : undefined; 
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "");

  // Função para formatar o input para dd/mm/aaaa
  const formatDateInput = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, ""); // Remove tudo que não é dígito

    if (value.length > 8) { // Limita a 8 dígitos para dd/mm/yyyy
      value = value.substring(0, 8);
    }

    let formattedValue = value;
    if (formattedValue.length > 2) {
      formattedValue = `${formattedValue.substring(0, 2)}/${formattedValue.substring(2)}`;
    }
    if (formattedValue.length > 5) {
      formattedValue = `${formattedValue.substring(0, 5)}/${formattedValue.substring(5)}`;
    }
    return formattedValue;
  };

  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, "dd/MM/yyyy", { locale: ptBR }));
    } else if (value === "") {
      setInputValue("");
    }
  }, [date, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawText = e.target.value;
    const maskedText = formatDateInput(rawText); // Aplica a máscara

    setInputValue(maskedText); // Atualiza o input com o valor mascarado

    // Tenta fazer o parse do texto mascarado
    const parsedDate = parse(maskedText, "dd/MM/yyyy", new Date(), { locale: ptBR });

    if (isValid(parsedDate) && format(parsedDate, "dd/MM/yyyy", { locale: ptBR }) === maskedText) {
      // Se o texto mascarado é uma data válida e completa, atualiza o valor do formulário
      onChange(format(parsedDate, "yyyy-MM-dd"));
    } else if (maskedText === "") {
      // Se o input está vazio, limpa o valor do formulário
      onChange("");
    } else {
      // Se é uma entrada parcial ou inválida, mas não vazia, não atualiza o valor do formulário
      // Isso permite que o usuário continue digitando sem que o formulário receba um valor inválido
      onChange(""); // Limpa o valor do formulário para indicar que a data não está completa/válida
    }
  };

  const handleDateSelect = (selectedDate?: Date) => {
    if (selectedDate) {
      const formattedForForm = format(selectedDate, "yyyy-MM-dd");
      onChange(formattedForForm);
      setInputValue(format(selectedDate, "dd/MM/yyyy", { locale: ptBR }));
      setOpen(false);
    } else {
      onChange("");
      setInputValue("");
    }
  };

  return (
    <div className="relative flex items-center">
      <Input
        id="date-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className={cn(
          "w-full pr-10",
          !date && "text-muted-foreground",
          "hover:bg-primary/10 hover:text-primary"
        )}
        disabled={disabled}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="absolute right-0 top-0 h-full px-3 py-2 rounded-l-none"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}