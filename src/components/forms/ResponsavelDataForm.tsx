"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { InscricaoFormData } from "@/lib/schemas/inscricao-schema";
import { formatCpf, formatPhone } from "@/lib/utils/form-helpers";
import { useCpfLookup } from "@/hooks/use-cpf-lookup";
import { Loader2 } from "lucide-react";

export const ResponsavelDataForm = () => {
  const { control } = useFormContext<InscricaoFormData>();
  const { isLookingUp } = useCpfLookup(); // Use o hook de busca por CPF

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Responsável</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* CPF field (movido para a primeira posição) */}
          <FormField
            control={control}
            name="cpf"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="cpf">CPF *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      {...field}
                      value={formatCpf(field.value)}
                      onChange={(e) => {
                        const formatted = formatCpf(e.target.value);
                        field.onChange(formatted);
                      }}
                      disabled={isLookingUp}
                    />
                    {isLookingUp && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Nome Completo field (movido para a segunda posição) */}
          <FormField
            control={control}
            name="nomeResponsavel"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="nome-responsavel">Nome Completo *</FormLabel>
                <FormControl>
                  <Input id="nome-responsavel" placeholder="Nome do responsável" {...field} disabled={isLookingUp} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="telefone"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="telefone">Telefone *</FormLabel>
                <FormControl>
                  <Input
                    id="telefone"
                    placeholder="(00) 9 0000-0000"
                    {...field}
                    value={formatPhone(field.value)}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      field.onChange(formatted);
                    }}
                    disabled={isLookingUp}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="telefone2"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="telefone2">Telefone 2</FormLabel>
                <FormControl>
                  <Input
                    id="telefone2"
                    placeholder="(00) 9 0000-0000"
                    {...field}
                    value={formatPhone(field.value)}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      field.onChange(formatted);
                    }}
                    disabled={isLookingUp}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="email">E-mail</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="email@exemplo.com" {...field} disabled={isLookingUp} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};