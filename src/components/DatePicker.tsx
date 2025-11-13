"use client";

import * as React from "react";
import { format } from "date-fns";
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

interface DatePickerProps {
  value?: string; // Espera uma string no formato "YYYY-MM-DD"
  onChange: (dateString: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", disabled }: DatePickerProps) {
  // Converte a string "YYYY-MM-DD" para um objeto Date.
  // Adiciona 'T00:00:00' para garantir que a data seja interpretada como UTC e evitar problemas de fuso horário.
  const date = value ? new Date(value + 'T00:00:00') : undefined; 
  const [open, setOpen] = React.useState(false); // Estado para controlar a abertura do popover

  return (
    <Popover open={open} onOpenChange={setOpen}> {/* Controla o estado de abertura do popover */}
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-left font-normal", // 'justify-between' empurra o ícone para a direita
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> {/* 'ml-auto' empurra o ícone para o final */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              // Formata o objeto Date de volta para a string "YYYY-MM-DD"
              onChange(format(selectedDate, "yyyy-MM-dd")); 
              setOpen(false); // Fecha o popover após a seleção
            } else {
              onChange(""); // Limpa a data se nada for selecionado
            }
          }}
          initialFocus
          locale={ptBR} // Define o idioma para Português do Brasil
        />
      </PopoverContent>
    </Popover>
  );
}