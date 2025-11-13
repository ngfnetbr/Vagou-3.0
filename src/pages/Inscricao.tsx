import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save } from "lucide-react";

const Inscricao = () => {
  return (
    <div className="container mx-auto px-4 py-6"> {/* Ajustado para ser um container interno */}
      <div className="max-w-4xl mx-auto">
        <form className="space-y-6">
          {/* Dados da Criança */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Criança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-crianca">Nome Completo *</Label>
                  <Input id="nome-crianca" placeholder="Ex: Ana Maria da Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-nascimento">Data de Nascimento *</Label>
                  <Input id="data-nascimento" type="date" placeholder="dd/mm/aaaa" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 gap-4">
                <div className="space-y-3 p-4 rounded-lg border bg-card md:col-span-1">
                  <Label className="text-base font-semibold">Sexo *</Label>
                  <RadioGroup defaultValue="feminino" className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="feminino" id="feminino" />
                      <Label htmlFor="feminino" className="font-normal cursor-pointer flex-1">Feminino</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="masculino" id="masculino" />
                      <Label htmlFor="masculino" className="font-normal cursor-pointer flex-1">Masculino</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-3 p-4 rounded-lg border bg-card md:col-span-4">
                  <Label className="text-base font-semibold">É beneficiário(a) de programas sociais? *</Label> {/* Alterado de text-sm para text-base */}
                  <RadioGroup defaultValue="nao" className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="sim" id="programas-sim" />
                      <Label htmlFor="programas-sim" className="font-normal cursor-pointer flex-1">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="nao" id="programas-nao" />
                      <Label htmlFor="programas-nao" className="font-normal cursor-pointer flex-1">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-3 p-4 rounded-lg border bg-card md:col-span-1">
                  <Label className="text-base font-semibold">Aceita qualquer CMEI? *</Label>
                  <RadioGroup defaultValue="nao" className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="sim" id="aceita-sim" />
                      <Label htmlFor="aceita-sim" className="font-normal cursor-pointer flex-1">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="nao" id="aceita-nao" />
                      <Label htmlFor="aceita-nao" className="font-normal cursor-pointer flex-1">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cmei-1">1ª Opção de CMEI *</Label>
                  <Select>
                    <SelectTrigger id="cmei-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cmei1">CMEI Exemplo 1</SelectItem>
                      <SelectItem value="cmei2">CMEI Exemplo 2</SelectItem>
                      <SelectItem value="cmei3">CMEI Exemplo 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cmei-2">2ª Opção de CMEI</Label>
                  <Select>
                    <SelectTrigger id="cmei-2">
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cmei1">CMEI Exemplo 1</SelectItem>
                      <SelectItem value="cmei2">CMEI Exemplo 2</SelectItem>
                      <SelectItem value="cmei3">CMEI Exemplo 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="nome-responsavel">Nome Completo *</Label>
                  <Input id="nome-responsavel" placeholder="Nome do responsável" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input id="cpf" placeholder="___.___.___-__" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input id="telefone" placeholder="(xx) x xxxx-xxxx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone2">Telefone 2</Label>
                  <Input id="telefone2" placeholder="(xx) x xxxx-xxxx" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço Residencial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input id="endereco" placeholder="Rua, número, complemento" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input id="bairro" placeholder="Bairro" />
                </div>
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
      </div>
    </div>
  );
};

export default Inscricao;