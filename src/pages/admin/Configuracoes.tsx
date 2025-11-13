import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Save, Settings2, Upload, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importar componentes de Tabs
import Importar from "@/pages/parametros/Importar"; // Importar o componente Importar
import TurmasBase from "@/pages/parametros/TurmasBase"; // Importar o componente TurmasBase

const Configuracoes = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Parâmetros gerais do sistema e configurações avançadas</p>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="importar">Importar Dados</TabsTrigger>
            <TabsTrigger value="turmas-base">Turmas Base</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Defina os parâmetros principais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome-municipio">Nome do Município</Label>
                    <Input
                      id="nome-municipio"
                      placeholder="Ex: Cidade Exemplo"
                      defaultValue="Cidade Exemplo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secretaria">Nome da Secretaria</Label>
                    <Input
                      id="secretaria"
                      placeholder="Ex: Secretaria Municipal de Educação"
                      defaultValue="Secretaria Municipal de Educação"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-contato">E-mail de Contato</Label>
                    <Input
                      id="email-contato"
                      type="email"
                      placeholder="contato@prefeitura.gov.br"
                      defaultValue="contato@prefeitura.gov.br"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone-contato">Telefone de Contato</Label>
                    <Input
                      id="telefone-contato"
                      placeholder="(00) 0000-0000"
                      defaultValue="(00) 3333-4444"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Período de Inscrições</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-inicio">Data de Início</Label>
                      <Input
                        id="data-inicio"
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data-fim">Data de Término</Label>
                      <Input
                        id="data-fim"
                        type="date"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Convocações</h3>

                  <div className="space-y-2">
                    <Label htmlFor="prazo-resposta">Prazo para Resposta (dias)</Label>
                    <Input
                      id="prazo-resposta"
                      type="number"
                      placeholder="7"
                      defaultValue="7"
                    />
                    <p className="text-sm text-muted-foreground">
                      Número de dias que o responsável tem para responder à convocação
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notificações</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notif-email">Notificações por E-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar e-mails automáticos para responsáveis
                      </p>
                    </div>
                    <Switch id="notif-email" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notif-sms">Notificações por SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar SMS para convocações e alertas
                      </p>
                    </div>
                    <Switch id="notif-sms" />
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                  <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="importar" className="mt-6">
            <Importar />
          </TabsContent>

          <TabsContent value="turmas-base" className="mt-6">
            <TurmasBase />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Configuracoes;