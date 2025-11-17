import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Bell, MessageSquare, Mail, Smartphone, AlertCircle } from "lucide-react";
import { useConfiguracoes, ConfiguracoesFormData } from "@/hooks/use-configuracoes";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input"; // Importando Input

// Esquema de validação para as configurações de notificação (subconjunto do schema principal)
const notificacaoSchema = z.object({
  notificacao_email: z.boolean(),
  notificacao_sms: z.boolean(),
  notificacao_whatsapp: z.boolean(),
  zapi_instance_id: z.string().optional().or(z.literal('')),
  zapi_token: z.string().optional().or(z.literal('')),
});

type NotificacaoFormData = z.infer<typeof notificacaoSchema>;

const Notificacoes = () => {
  const { config, isLoading, updateConfiguracoes, isUpdating } = useConfiguracoes();

  const form = useForm<NotificacaoFormData>({
    resolver: zodResolver(notificacaoSchema),
    values: {
      notificacao_email: config?.notificacao_email ?? true,
      notificacao_sms: config?.notificacao_sms ?? false,
      notificacao_whatsapp: config?.notificacao_whatsapp ?? false,
      zapi_instance_id: config?.zapi_instance_id || '',
      zapi_token: config?.zapi_token || '',
    },
    mode: "onChange",
  });

  const onSubmit = async (data: NotificacaoFormData) => {
    if (!config) {
        toast.error("Erro", { description: "Configurações não carregadas." });
        return;
    }
    
    // Validação adicional para garantir que as chaves sejam preenchidas se o WhatsApp estiver ativo
    if (data.notificacao_whatsapp && (!data.zapi_instance_id || !data.zapi_token)) {
        toast.error("Configuração Incompleta", { description: "Se a notificação por WhatsApp estiver ativa, o ID da Instância e o Token são obrigatórios." });
        return;
    }
    
    // Mescla os dados de notificação com o restante dos dados de configuração
    const fullData: ConfiguracoesFormData = {
        ...config,
        ...data,
    };
    
    await updateConfiguracoes(fullData);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando configurações de notificação...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Gerencie os canais de comunicação utilizados para alertar os responsáveis sobre o status da fila e convocações.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            
            {/* Canais de Notificação */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Canais Ativos</h3>

              <FormField
                control={form.control}
                name="notificacao_email"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="space-y-1 flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <FormLabel htmlFor="notif-email" className="text-base">Notificações por E-mail</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        id="notif-email" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        disabled={isUpdating}
                      />
                    </FormControl>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="notificacao_sms"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="space-y-1 flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <FormLabel htmlFor="notif-sms" className="text-base">Notificações por SMS</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        id="notif-sms" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        disabled={isUpdating}
                      />
                    </FormControl>
                  </div>
                )}
              />
              
              <FormField
                control={form.control}
                name="notificacao_whatsapp"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="space-y-1 flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-secondary" />
                      <FormLabel htmlFor="notif-whatsapp" className="text-base">Notificações por WhatsApp (Z-API)</FormLabel>
                    </div>
                    <FormControl>
                      <Switch 
                        id="notif-whatsapp" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        disabled={isUpdating}
                      />
                    </FormControl>
                  </div>
                )}
              />
            </div>

            <Separator />
            
            {/* Configuração do WhatsApp (Chaves no DB) */}
            <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Chaves de Acesso Z-API
                </h3>
                <p className="text-sm text-muted-foreground">
                    Insira as chaves de acesso do Z-API. Elas serão usadas pela Edge Function para enviar mensagens.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="zapi_instance_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID da Instância (ZAPI_INSTANCE_ID)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: 3DC7A776B94830AB77B756C5A090F8FA" {...field} disabled={isUpdating} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="zapi_token"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Token de Acesso (ZAPI_TOKEN)</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Ex: 51BBE9B5994BCE59700A948E" {...field} disabled={isUpdating} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <p className="text-xs text-muted-foreground italic mt-3">
                    Nota: Se você já configurou esses valores como Secrets no Supabase, eles serão ignorados em favor dos valores salvos aqui no DB.
                </p>
            </div>

            {/* Botões de Ação do Formulário */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="submit" className="w-48 bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isUpdating ? "Salvando..." : "Salvar Notificações"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
};

export default Notificacoes;