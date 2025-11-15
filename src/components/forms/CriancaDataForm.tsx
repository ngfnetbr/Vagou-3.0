"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/DatePicker";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { AlertCircle, Baby } from "lucide-react";
import { useAgeInMonths } from "@/hooks/use-age-in-months";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CriancaDataFormProps {
  cmeiOptions: { value: string; label: string }[];
  filteredCmei2Options: { value: string; label: string }[];
  selectedCmei1: string;
}

export const CriancaDataForm = ({ cmeiOptions, filteredCmei2Options, selectedCmei1 }: CriancaDataFormProps) => {
  const { control, watch } = useFormContext<InscricaoFormData>();
  
  const dataNascimento = watch("dataNascimento");
  const ageInMonths = useAgeInMonths(dataNascimento);
  
  const isUnderSixMonths = ageInMonths !== null && ageInMonths < 6;
  
  // Estado para controlar a exibição do modal
  const [showAgeWarningModal, setShowAgeWarningModal] = useState(false);
  // Estado para garantir que o aviso só apareça uma vez por sessão de preenchimento
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    if (isUnderSixMonths && !hasShownWarning) {
      setShowAgeWarningModal(true);
      setHasShownWarning(true);
    }
  }, [isUnderSixMonths, hasShownWarning]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Criança</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="nomeCrianca"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="nome-crianca">Nome Completo *</FormLabel>
                <FormControl>
                  <Input id="nome-crianca" placeholder="Ex: Ana Maria da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="dataNascimento"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="data-nascimento">
                  Data de Nascimento *
                  {isUnderSixMonths && (
                    <span className="ml-2 text-sm font-normal text-red-500">(Menor de 6 meses)</span>
                  )}
                </FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="dd/mm/aaaa"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid md:grid-cols-3 gap-4"> 
          <FormField
            control={control}
            name="sexo"
            render={({ field }) => (
              <FormItem className="space-y-3 p-4 rounded-lg border bg-card">
                <FormLabel className="text-base font-semibold">Sexo *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col gap-3"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="feminino" id="feminino" />
                      </FormControl>
                      <FormLabel htmlFor="feminino" className="inline-flex items-center h-4 font-normal cursor-pointer whitespace-nowrap flex-shrink-0 -translate-y-[4px]">Feminino</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="masculino" id="masculino" />
                      </FormControl>
                      <FormLabel htmlFor="masculino" className="inline-flex items-center h-4 font-normal cursor-pointer whitespace-nowrap flex-shrink-0 -translate-y-[4px]">Masculino</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="programasSociais"
            render={({ field }) => (
              <FormItem className="space-y-3 p-4 rounded-lg border bg-card">
                <FormLabel className="text-base font-semibold">Programas Sociais *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col gap-3"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="sim" id="programas-sim" />
                      </FormControl>
                      <FormLabel htmlFor="programas-sim" className="inline-flex items-center h-4 font-normal cursor-pointer whitespace-nowrap flex-shrink-0 -translate-y-[4px]">Beneficiário(a)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="nao" id="programas-nao" />
                      </FormControl>
                      <FormLabel htmlFor="programas-nao" className="inline-flex items-center h-4 font-normal cursor-pointer whitespace-nowrap flex-shrink-0 -translate-y-[4px]">Não beneficiário(a)</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="aceitaQualquerCmei"
            render={({ field }) => (
              <FormItem className="space-y-3 p-4 rounded-lg border bg-card">
                <FormLabel className="text-base font-semibold">Aceita Qualquer CMEI? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col gap-3"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="sim" id="aceita-sim" />
                      </FormControl>
                      <FormLabel htmlFor="aceita-sim" className="inline-flex items-center h-4 font-normal cursor-pointer whitespace-nowrap flex-shrink-0 -translate-y-[4px]">Sim</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="nao" id="aceita-nao" />
                      </FormControl>
                      <FormLabel htmlFor="aceita-nao" className="inline-flex items-center h-4 font-normal cursor-pointer whitespace-nowrap flex-shrink-0 -translate-y-[4px]">Não</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="cmei1"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="cmei-1">1ª Opção de CMEI *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger id="cmei-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cmeiOptions.map((cmei) => (
                      <SelectItem key={cmei.value} value={cmei.value}>
                        {cmei.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="cmei2"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="cmei-2">2ª Opção de CMEI</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger id="cmei-2" disabled={!selectedCmei1}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCmei2Options.map((cmei) => (
                      <SelectItem key={cmei.value} value={cmei.value}>
                        {cmei.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
      
      {/* Modal de Aviso de Idade Mínima */}
      <Dialog open={showAgeWarningModal} onOpenChange={setShowAgeWarningModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 text-accent">
                <Baby className="h-6 w-6" />
                <DialogTitle className="text-xl">Aviso de Idade Mínima</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              A criança tem menos de 6 meses de idade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground">
              **Observação:** Crianças abaixo de 6 meses de idade continuarão em lista de espera, mesmo que sua vez chegue, pois a idade mínima para início no CMEI é 6 meses.
            </p>
            <p className="text-xs text-muted-foreground">
              Você pode prosseguir com a inscrição, mas a matrícula só será efetivada após a criança completar 6 meses.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAgeWarningModal(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};