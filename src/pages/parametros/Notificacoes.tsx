import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Bell, MessageSquare, Mail, Smartphone, AlertCircle, Zap } from "lucide-react";
import { useConfiguracoes, ConfiguracoesFormData } from "@/hooks/use-configuracoes";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Esquema de validação para as configurações de notificação (subconjunto do schema principal)
const notificacaoSchema = z.object({
  notificacao_email: z.boolean(),
  notificacao_sms: z.boolean(),
  notificacao_whatsapp: z.boolean(),
  webhook_url_notificacao: z.string().url("URL do Webhook inválida.").optional().or(z.literal('')),
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
      webhook_url_notificacao: config?.webhook_url_notificacao || '',
    },
    mode: "onChange",
  });

  const onSubmit = async (data: NotificacaoFormData) => {
    if (!config) {
        toast.error("Erro", { description: "Configurações não carregadas." });
        return;
    }
    
    // Validação adicional para garantir que o URL seja preenchido se o WhatsApp estiver ativo
    if (data.notificacao_whatsapp && !data.webhook_url_notificacao) {
        toast.error("Configuração Incompleta", { description: "Se a notificação por WhatsApp estiver ativa, o URL do Webhook é obrigatório." });
        return;
    }
    
    // Mescla os dados de notificação com o restante dos dados de configuração
    const fullData: ConfiguracoesFormData = {
        ...config,
        ...data,
        // Limpa as chaves Z-API antigas, pois agora o Make as gerencia
        zapi_instance_id: null,
        zapi_token: null,
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
                      <FormLabel htmlFor="notif-whatsapp" className="text-base">Notificações por WhatsApp (via Webhook)</FormLabel>
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
            
            {/* Configuração do Webhook (Make/Integromat) */}
            <div className="space-y-4 p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Configuração do Webhook (Make/Integromat)
                </h3>
                <p className="text-sm text-muted-foreground">
                    Insira o URL do Webhook gerado pelo seu cenário no Make/Integromat. O sistema enviará um payload JSON para este endereço quando houver uma convocação ou matrícula confirmada.
                </p>
                
                <FormField
                    control={form.control}
                    name="webhook_url_notificacao"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL do Webhook *</FormLabel>
                            <FormControl>
                                <Input placeholder="https://hook.eu1.make.com/..." {...field} disabled={isUpdating} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <p className="text-xs text-muted-foreground italic mt-3">
                    Certifique-se de que o Webhook esteja configurado para escutar eventos POST e que o cenário no Make lide com a lógica de envio de WhatsApp (usando suas próprias credenciais Z-API ou outro provedor).
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