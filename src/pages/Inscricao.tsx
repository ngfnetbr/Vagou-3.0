import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// O componente Switch não será mais necessário para esses campos, então o import pode ser removido se não for usado em outro lugar.

// Funções de máscara
const formatCpf = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
  if (value.length > 11) { // Limita a 11 dígitos
    value = value.substring(0, 11);
  }
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return value;
};

const formatPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, ""); // Remove tudo que não é dígito

  if (value.length > 11) {
    value = value.substring(0, 11); // Limita a 11 dígitos
  }

  let formattedValue = value;
  if (formattedValue.length > 0) {
    formattedValue = `(${formattedValue}`;
  }
  if (formattedValue.length > 3) { // Depois de (XX
    formattedValue = `${formattedValue.substring(0, 3)}) ${formattedValue.substring(3)}`;
  }
  if (formattedValue.length > 6 && formattedValue.charAt(6) !== ' ') { // Depois de (XX) X
    formattedValue = `${formattedValue.substring(0, 6)} ${formattedValue.substring(6)}`;
  }
  if (formattedValue.length > 11) { // Depois de (XX) X XXXX
    formattedValue = `${formattedValue.substring(0, 11)}-${formattedValue.substring(11)}`;
  }
  return formattedValue;
};

// Esquema de validação com Zod
const formSchema = z.object({
  nomeCrianca: z.string().min(1, "Nome completo da criança é obrigatório."),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória."),
  sexo: z.enum(["feminino", "masculino"], { message: "Selecione o sexo da criança." }),
  programasSociais: z.enum(["sim", "nao"], { message: "Selecione se é beneficiário de programas sociais." }),
  aceitaQualquerCmei: z.enum(["sim", "nao"], { message: "Selecione se aceita qualquer CMEI." }),
  cmei1: z.string().min(1, "1ª Opção de CMEI é obrigatória."),
  cmei2: z.string().optional().or(z.literal('')),
  nomeResponsavel: z.string().min(1, "Nome completo do responsável é obrigatório."),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido. Formato esperado: 000.000.000-00."),
  telefone: z.string().regex(/^\(\d{2}\) \d \d{4}-\d{4}$/, "Telefone inválido. Formato esperado: (00) 9 0000-0000."),
  telefone2: z.string().optional().or(z.literal('')),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
  bairro: z.string().optional().or(z.literal('')),
});

const Inscricao = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCrianca: "",
      dataNascimento: "",
      sexo: "feminino",
      programasSociais: "nao",
      aceitaQualquerCmei: "nao",
      cmei1: "",
      cmei2: "",
      nomeResponsavel: "",
      cpf: "",
      telefone: "",
      telefone2: "",
      email: "",
      endereco: "",
      bairro: "",
    },
  });

  const cmeiOptions = [
    { value: "cmei1", label: "CMEI Exemplo 1" },
    { value: "cmei2", label: "CMEI Exemplo 2" },
    { value: "cmei3", label: "CMEI Exemplo 3" },
    { value: "cmei4", label: "CMEI Exemplo 4" },
  ];

  const selectedCmei1 = form.watch("cmei1");
  const filteredCmei2Options = cmeiOptions.filter(
    (cmei) => cmei.value !== selectedCmei1
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Dados do formulário:", values);
    // Aqui você enviaria os dados para o backend
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados da Criança */}
            <Card>
              <CardHeader>
                <CardTitle>Dados da Criança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="data-nascimento">Data de Nascimento *</FormLabel>
                        <FormControl>
                          <Input id="data-nascimento" type="date" placeholder="dd/mm/aaaa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid md:grid-cols-3 gap-4"> 
                  <FormField
                    control={form.control}
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
                              <FormLabel htmlFor="feminino" className="font-normal cursor-pointer whitespace-nowrap flex-shrink-0">Feminino</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="masculino" id="masculino" />
                              </FormControl>
                              <FormLabel htmlFor="masculino" className="font-normal cursor-pointer whitespace-nowrap flex-shrink-0">Masculino</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="programasSociais"
                    render={({ field }) => (
                      <FormItem className="space-y-3 p-4 rounded-lg border bg-card">
                        <FormLabel className="text-base font-semibold">Programas Sociais? *</FormLabel>
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
                              <FormLabel htmlFor="programas-sim" className="font-normal cursor-pointer whitespace-nowrap flex-shrink-0">Sim</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="nao" id="programas-nao" />
                              </FormControl>
                              <FormLabel htmlFor="programas-nao" className="font-normal cursor-pointer whitespace-nowrap flex-shrink-0">Não</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
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
                              <FormLabel htmlFor="aceita-sim" className="font-normal cursor-pointer whitespace-nowrap flex-shrink-0">Sim</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="nao" id="aceita-nao" />
                              </FormControl>
                              <FormLabel htmlFor="aceita-nao" className="font-normal cursor-pointer whitespace-nowrap flex-shrink-0">Não</FormLabel>
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
                    control={form.control}
                    name="cmei1"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="cmei-1">1ª Opção de CMEI *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    control={form.control}
                    name="cmei2"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="cmei-2">2ª Opção de CMEI</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger id="cmei-2" disabled={!selectedCmei1}>
                              <SelectValue placeholder="Selecione (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sem segunda opção</SelectItem> {/* Nova opção adicionada aqui */}
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
            </Card>

            {/* Dados do Responsável */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nomeResponsavel"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="nome-responsavel">Nome Completo *</FormLabel>
                        <FormControl>
                          <Input id="nome-responsavel" placeholder="Nome do responsável" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="cpf">CPF *</FormLabel>
                        <FormControl>
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            {...field}
                            value={formatCpf(field.value)}
                            onChange={(e) => {
                              const formatted = formatCpf(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="telefone">Telefone *</FormLabel>
                        <FormControl>
                          <Input
                            id="telefone"
                            placeholder="(44) 9 9999-9999"
                            {...field}
                            value={formatPhone(field.value)}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefone2"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="telefone2">Telefone 2</FormLabel>
                        <FormControl>
                          <Input
                            id="telefone2"
                            placeholder="(44) 9 9999-9999 (opcional)"
                            {...field}
                            value={formatPhone(field.value)}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor="email">E-mail</FormLabel>
                      <FormControl>
                        <Input id="email" type="email" placeholder="email@exemplo.com (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço Residencial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="endereco">Endereço</FormLabel>
                        <FormControl>
                          <Input id="endereco" placeholder="Rua, número, complemento (opcional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="bairro">Bairro</FormLabel>
                        <FormControl>
                          <Input id="bairro" placeholder="Bairro (opcional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Save className="mr-2 h-4 w-4" />
                Enviar Inscrição
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Inscricao;