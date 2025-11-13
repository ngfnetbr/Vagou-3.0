import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCriancas } from "@/hooks/use-criancas";
import { Crianca, CriancaStatus } from "@/lib/mock-data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Home,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  ClipboardList,
  Loader2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Inscricao from "../Inscricao";
import { toast } from "sonner";

const DetalhesCrianca = () => {
  const { id } = useParams<{ id: string }>();
  const criancaId = id ? parseInt(id) : undefined;
  // Corrigido: updateCriancaStatus agora existe no hook
  const { criancas, isLoading, updateCriancaStatus } = useCriancas(); 
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const crianca = useMemo(() => {
    return criancas.find((c) => c.id === criancaId);
  }, [criancas, criancaId]);

  // Corrigido: Adicionado 'success' ao tipo de retorno para o Badge
  const getStatusVariant = (status: CriancaStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Matriculado":
        return "default"; 
      case "Fila de Espera":
        return "secondary";
      case "Convocado":
        return "outline";
      case "Desistente":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleStatusUpdate = async (newStatus: CriancaStatus) => {
    if (!crianca) return;

    // Corrigido: Tipagem de newStatus agora é CriancaStatus
    const action = newStatus === "Convocado" ? "Convocação para Matrícula" : 
                   newStatus === "Matriculado" ? "Matrícula Efetivada" :
                   newStatus === "Desistente" ? "Marcação como Desistente" : "Atualização de Status";

    const successMessage = newStatus === "Convocado" ? "Criança convocada com sucesso!" :
                           newStatus === "Matriculado" ? "Matrícula confirmada!" :
                           newStatus === "Desistente" ? "Criança marcada como desistente." : "Status atualizado.";

    await updateCriancaStatus({
      id: crianca.id,
      newStatus,
      action,
      cmei: crianca.cmei1,
    });
    toast.success(successMessage);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando detalhes da criança...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!crianca) {
    return (
      <AdminLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Criança não encontrada</h2>
          <p className="text-muted-foreground mt-2">
            O ID {id} não corresponde a nenhuma criança cadastrada.
          </p>
          <Button onClick={() => navigate("/admin/criancas")} className="mt-4">
            Voltar para a lista
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const dataNascimentoFormatada = format(
    new Date(crianca.dataNascimento + 'T00:00:00'),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  const getPriorityLabel = (c: Crianca) => {
    if (c.programasSociais === "sim") {
      return "Prioridade Social";
    }
    return "Normal";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Detalhes da Criança
            </h1>
            <p className="text-muted-foreground">
              Informações completas sobre {crianca.nomeCrianca}
            </p>
          </div>
          <div className="flex space-x-2">
            {crianca.status === "Fila de Espera" && (
                <Button 
                    variant="secondary" 
                    onClick={() => handleStatusUpdate("Convocado")}
                >
                    <Bell className="mr-2 h-4 w-4" />
                    Convocar
                </Button>
            )}
            {crianca.status === "Convocado" && (
                <>
                    <Button 
                        // Corrigido: Usando 'default' em vez de 'success' para Button
                        variant="default" 
                        onClick={() => handleStatusUpdate("Matriculado")}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Matrícula
                    </Button>
                    <Button 
                        variant="destructive" 
                        // Corrigido: Argumento 'Desistente' agora é válido
                        onClick={() => handleStatusUpdate("Desistente")} 
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Marcar Desistente
                    </Button>
                </>
            )}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Dados
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle>Editar Inscrição</DialogTitle>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto p-6 pt-0">
                    <Inscricao 
                        isModal 
                        criancaId={crianca.id}
                        initialData={{
                            nomeCrianca: crianca.nomeCrianca,
                            dataNascimento: crianca.dataNascimento,
                            sexo: crianca.sexo,
                            programasSociais: crianca.programasSociais,
                            aceitaQualquerCmei: crianca.aceitaQualquerCmei,
                            cmei1: crianca.cmei1,
                            cmei2: crianca.cmei2,
                            nomeResponsavel: crianca.nomeResponsavel,
                            // Propriedades de contato
                            cpf: crianca.cpf, 
                            telefone: crianca.telefone, 
                            telefone2: crianca.telefone2, 
                            email: crianca.email, 
                            endereco: crianca.endereco,
                            bairro: crianca.bairro,
                            observacoes: crianca.observacoes,
                        }}
                        onSuccess={() => {
                            setIsModalOpen(false);
                            toast.success("Dados da criança atualizados com sucesso!");
                        }}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna 1: Dados da Criança e Status */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Dados Principais
                  {/* Corrigido: getStatusVariant retorna um tipo válido para Badge */}
                  <Badge variant={getStatusVariant(crianca.status)}> 
                    {crianca.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-lg font-semibold">{crianca.nomeCrianca}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm">
                    Nascimento: {dataNascimentoFormatada}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm">Sexo: {crianca.sexo === 'masculino' ? 'Masculino' : 'Feminino'}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm">
                    Prioridade:{" "}
                    <Badge variant={crianca.programasSociais === "sim" ? "default" : "outline"}>
                        {getPriorityLabel(crianca)}
                    </Badge>
                  </p>
                </div>
                <Separator />
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Preferências de CMEI
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <Home className="h-5 w-5 text-secondary flex-shrink-0" />
                        <p className="text-sm font-medium">1ª Opção: {crianca.cmei1}</p>
                    </div>
                    {crianca.cmei2 && (
                        <div className="flex items-center space-x-3">
                            <Home className="h-5 w-5 text-secondary/70 flex-shrink-0" />
                            <p className="text-sm">2ª Opção: {crianca.cmei2}</p>
                        </div>
                    )}
                    {crianca.aceitaQualquerCmei === 'sim' && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                            Aceita qualquer CMEI.
                        </p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Dados do Responsável */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados do Responsável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-sm font-medium">
                      {crianca.nomeResponsavel || 'Não informado'}
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ClipboardList className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <p className="text-sm">
                      CPF: {crianca.cpf || 'Não informado'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <p className="text-sm">
                      Telefone 1: {crianca.telefone || 'Não informado'}
                    </p>
                  </div>
                  {crianca.telefone2 && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      <p className="text-sm">
                        Telefone 2: {crianca.telefone2}
                      </p>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <p className="text-sm">
                      Email: {crianca.email || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <h3 className="font-semibold text-sm text-muted-foreground">
                Endereço
              </h3>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                <p className="text-sm my-0">
                  {crianca.endereco || 'Não informado'}
                  {crianca.bairro && `, Bairro: ${crianca.bairro}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico e Observações */}
        <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Histórico de Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                    {crianca.historico && crianca.historico.length > 0 ? (
                        <div className="space-y-4">
                            {crianca.historico.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((item, index) => (
                                <div key={index} className="flex items-start space-x-4">
                                    <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{item.acao}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {/* Corrigido: item.cmei agora existe */}
                                            {format(new Date(item.data + 'T00:00:00'), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - {item.cmei || 'Sistema'} 
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Nenhuma movimentação registrada.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {crianca.observacoes || 'Nenhuma observação registrada.'}
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DetalhesCrianca;