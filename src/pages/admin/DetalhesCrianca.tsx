import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, MapPin, Phone, Mail, Edit, History, Loader2, FileText, CheckCircle, ListOrdered, School, Clock, XCircle, RotateCcw, ListRestart, Bell, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useCriancaDetails, useCriancas, useCriancaHistorico } from "@/hooks/use-criancas";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaCriancaModalContent from "@/components/NovaCriancaModal";
import { useState } from "react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ConvocarModal from "@/components/ConvocarModal";
import JustificativaModal from "@/components/JustificativaModal";
import { Crianca } from "@/integrations/supabase/types"; // Importação atualizada
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type JustificativaAction = 'recusada' | 'desistente' | 'fim_de_fila';

const DetalhesCrianca = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const criancaId = id;
  
  const { data: crianca, isLoading, error, refetch } = useCriancaDetails(criancaId || '');
  const { data: historicoData, isLoading: isLoadingHistorico } = useCriancaHistorico(criancaId || '');
  
  const { 
    marcarFimDeFila, 
    isMarkingFimDeFila, 
    reativarCrianca, 
    isReactivating,
    marcarDesistente,
    isMarkingDesistente,
    marcarRecusada,
    isMarkingRecusada,
    confirmarMatricula,
    isConfirmingMatricula,
    deleteCrianca,
    isDeleting,
    resendConvocationNotification, // NOVO
    isResendingNotification, // NOVO
  } = useCriancas();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvocarModalOpen, setIsConvocarModalOpen] = useState(false);
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);


  const handleGeneratePdf = () => {
    toast.info("Gerando Ficha em PDF...", {
      description: `A ficha de ${crianca?.nome} será gerada em breve.`,
    });
    // Lógica de geração de PDF seria implementada aqui
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando ficha da criança...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !crianca) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              Erro ao carregar detalhes da criança ou criança não encontrada.
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary text-secondary-foreground", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary text-secondary-foreground", text: "Matriculado" },
      "Fila de Espera": { className: "bg-accent/20 text-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
      "Remanejamento Solicitado": { className: "bg-accent/20 text-foreground", text: "Remanejamento Solicitado" },
    };
    
    const config = variants[status] || { className: "bg-muted text-muted-foreground", text: status };
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  const handleEditSuccess = () => {
    setIsModalOpen(false);
    refetch(); // Refresh data after successful edit/delete
  };
  
  const handleDelete = async () => {
    if (criancaId) {
      try {
        await deleteCrianca(criancaId);
        navigate('/admin/criancas'); // Navigate back to list after deletion
      } catch (e: any) {
        toast.error("Falha na Exclusão", {
          description: e.message,
        });
      }
    }
  };
  
  const handleConvocarSuccess = () => {
    setIsConvocarModalOpen(false);
    refetch(); // Refresh data after successful convocation
  };
  
  const handleJustificativaAction = (action: JustificativaAction) => {
    setCurrentJustificativaAction(action);
    setIsJustificativaModalOpen(true);
  };
  
  const handleJustificativaConfirm = async (justificativa: string) => {
    if (!criancaId || !currentJustificativaAction) return;
    
    try {
        switch (currentJustificativaAction) {
          case 'recusada':
            await marcarRecusada({ id: criancaId, justificativa });
            break;
          case 'desistente':
            await marcarDesistente({ id: criancaId, justificativa });
            break;
          case 'fim_de_fila':
            await marcarFimDeFila({ id: criancaId, justificativa });
            break;
        }
        refetch();
        setIsJustificativaModalOpen(false);
        setCurrentJustificativaAction(undefined);
    } catch (e) {
        // Erro já tratado pelo hook
    }
  };
  
  const getJustificativaProps = (action: JustificativaAction) => {
    const criancaNome = crianca.nome;
    const isPending = action === 'recusada' ? isMarkingRecusada : 
                      action === 'desistente' ? isMarkingDesistente : 
                      isMarkingFimDeFila;
                      
    switch (action) {
      case 'recusada':
        return {
          title: `Recusar Convocação de ${criancaNome}`,
          description: "Confirme a recusa da convocação. A criança será marcada como 'Recusada'.",
          actionLabel: "Confirmar Recusa",
          isPending,
        };
      case 'desistente':
        return {
          title: `Marcar ${criancaNome} como Desistente`,
          description: "Confirme a desistência. A criança será removida permanentemente da fila.",
          actionLabel: "Confirmar Desistência",
          isPending,
        };
      case 'fim_de_fila':
        return {
          title: `Marcar Fim de Fila para ${criancaNome}`,
          description: "Confirme o fim de fila. A criança será movida para o final da fila de espera.",
          actionLabel: "Confirmar Fim de Fila",
          isPending,
        };
      default:
        return { title: "", description: "", actionLabel: "", isPending: false };
    }
  };
  
  const handleReativar = async () => {
    if (criancaId) {
      await reativarCrianca(criancaId);
      refetch();
    }
  };
  
  const handleConfirmarMatricula = async () => {
    if (criancaId) {
      await confirmarMatricula(criancaId);
      refetch();
    }
  };
  
  const handleResendNotification = async () => {
    if (criancaId) {
        try {
            await resendConvocationNotification(criancaId);
        } catch (e: any) {
            toast.error("Falha no Reenvio", {
                description: e.message,
            });
        }
    }
  };

  const isMatriculado = crianca.status === 'Matriculado' || crianca.status === 'Matriculada';
  const isFila = crianca.status === 'Fila de Espera';
  const isConvocado = crianca.status === 'Convocado';
  const isDesistente = crianca.status === 'Desistente';
  const isRecusada = crianca.status === 'Recusada';
  const isRemanejamento = crianca.status === 'Remanejamento Solicitado'; // Novo status

  const deadlineInfo = isConvocado && crianca.convocacao_deadline ? (() => {
    const deadlineDate = parseISO(crianca.convocacao_deadline + 'T00:00:00');
    const today = new Date();
    const daysRemaining = differenceInDays(deadlineDate, today);
    
    const isExpired = daysRemaining < 0;

    if (isExpired) {
        return {
            text: `Prazo Expirado em ${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })}`,
            className: "bg-destructive/20 text-destructive",
            icon: XCircle,
            isExpired: true,
        };
    }
    
    return {
        text: `Prazo de resposta: ${daysRemaining} dias (até ${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })})`,
        className: "bg-accent/20 text-foreground",
        icon: Clock,
        isExpired: false,
    };
  })() : null;

  // Formatação da data de nascimento
  const formattedDataNascimento = crianca.data_nascimento 
    ? format(parseISO(crianca.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    : 'N/A';


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{crianca.nome}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {crianca.idade}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Button>
            <Button 
              variant="outline" 
              className="text-secondary border-secondary hover:bg-secondary/10"
              onClick={handleGeneratePdf}
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar Ficha em PDF
            </Button>
            
            {/* Ações de Status */}
            
            {/* 1. Se Convocado: Confirmar Matrícula, Recusar, Fim de Fila, Desistir, Reconvocar */}
            {isConvocado && (
                <>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="secondary" 
                                className="text-secondary-foreground hover:bg-secondary/90"
                                disabled={isConfirmingMatricula}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmar Matrícula
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Matrícula?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você está confirmando a matrícula de <span className="font-semibold">{crianca.nome}</span> no CMEI {crianca.cmeiNome}. Esta ação é irreversível.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isConfirmingMatricula}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleConfirmarMatricula} 
                                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                    disabled={isConfirmingMatricula}
                                >
                                    {isConfirmingMatricula ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Matrícula"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                        variant="outline" 
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleJustificativaAction('recusada')}
                        disabled={isMarkingRecusada}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Recusar
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="text-accent border-accent hover:bg-accent/10"
                        onClick={() => handleJustificativaAction('fim_de_fila')}
                        disabled={isMarkingFimDeFila}
                    >
                        <ListRestart className="mr-2 h-4 w-4" />
                        Fim de Fila
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        className="text-primary border-primary hover:bg-primary/10"
                        onClick={handleResendNotification}
                        disabled={isResendingNotification}
                    >
                        {isResendingNotification ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Bell className="mr-2 h-4 w-4" />
                        )}
                        Reenviar Notificação
                    </Button>
                </>
            )}
            
            {/* 2. Se Desistente ou Recusada: Reativar */}
            {(isDesistente || isRecusada) && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="secondary" 
                            className="text-secondary-foreground hover:bg-secondary/90"
                            disabled={isReactivating}
                        >
                            <ListRestart className="mr-2 h-4 w-4" />
                            Reativar na Fila
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Reativação?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação reativará <span className="font-semibold">{crianca.nome}</span> na fila de espera, colocando-a no final da fila.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isReactivating}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleReativar} 
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                disabled={isReactivating}
                            >
                                {isReactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Reativação"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            
            {/* 3. Se Fila de Espera, Convocado (expirado) ou Recusada: Convocar/Reconvocar */}
            {(!isMatriculado && !isDesistente && !isRemanejamento) && (
                <Dialog open={isConvocarModalOpen} onOpenChange={setIsConvocarModalOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="text-primary border-primary hover:bg-primary/10"
                        >
                            {isConvocado && deadlineInfo?.isExpired ? (
                                <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reconvocar
                                </>
                            ) : (
                                <>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Convocar
                                </>
                            )}
                        </Button>
                    </DialogTrigger>
                    <ConvocarModal 
                        crianca={crianca} 
                        onClose={handleConvocarSuccess}
                    />
                </Dialog>
            )}
            
            {/* 4. Se Matriculado OU Remanejamento Solicitado: Marcar Desistente */}
            {(isMatriculado || isRemanejamento) && (
                <Button 
                    variant="outline" 
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => handleJustificativaAction('desistente')}
                    disabled={isMarkingDesistente}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Marcar Desistente
                </Button>
            )}
            
            {/* Botão de Editar Dados (sempre disponível) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Dados
                </Button>
              </DialogTrigger>
              <NovaCriancaModalContent 
                onClose={handleEditSuccess} 
                initialData={crianca}
              />
            </Dialog>
            
            {/* Botão de Excluir (Apenas se não estiver em status ativo) */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting || isMatriculado || isFila || isConvocado || isRemanejamento}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a criança 
                            <span className="font-semibold"> {crianca.nome} </span>
                            e todos os seus registros.
                            <p className="mt-2 text-sm text-destructive font-semibold">A exclusão só é permitida se a criança não estiver em status ativo (Fila, Convocado, Matriculado ou Remanejamento Solicitado).</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status e Localização - Layout ajustado para 3 colunas */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(crianca.status)}
              <p className="text-sm text-muted-foreground mt-2">
                {isMatriculado 
                  ? `Matriculado(a) no ${crianca.cmeiNome}` 
                  : isRemanejamento
                  ? `Matriculado(a) no ${crianca.cmeiNome} (Aguardando Remanejamento)`
                  : isConvocado
                  ? `Convocado(a) para ${crianca.cmeiNome}`
                  : isDesistente
                  ? 'Removido(a) da fila por desistência.'
                  : isRecusada
                  ? 'Convocação recusada.'
                  : `Na fila de espera.`
                }
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes da Vaga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(isMatriculado || isRemanejamento) && crianca.turmaNome ? (
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Turma Atual: {crianca.turmaNome}</p>
                </div>
              ) : isFila && crianca.posicao_fila !== undefined ? (
                <div className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium">Posição na Fila: #{crianca.posicao_fila}</p>
                </div>
              ) : isConvocado && crianca.turmaNome ? (
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Vaga Ofertada: {crianca.turmaNome}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma turma ou posição na fila definida.</p>
              )}
              
              {isRemanejamento && crianca.cmeiRemanejamentoNome && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <RotateCcw className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium text-accent">Remanejamento para: {crianca.cmeiRemanejamentoNome}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prazo de Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              {deadlineInfo ? (
                <div className={`flex items-center gap-2 text-sm font-medium p-2 rounded-lg ${deadlineInfo.className}`}>
                    <deadlineInfo.icon className="h-4 w-4" />
                    <p>{deadlineInfo.text}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                    {isConvocado ? 'Prazo não definido.' : 'Não aplicável (Criança não convocada).'}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className={`h-4 w-4 ${crianca.aceita_qualquer_cmei ? 'text-secondary' : 'text-destructive'}`} />
                <p className="text-sm text-muted-foreground">
                  Aceita qualquer CMEI: <span className="font-medium capitalize">{crianca.aceita_qualquer_cmei ? 'Sim' : 'Não'}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dados Detalhados */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
            <CardDescription>Informações completas da criança e do responsável.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Coluna 1: Criança */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Criança</h3>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{crianca.nome}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">Data Nasc.: {formattedDataNascimento}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium">Sexo:</span>
                  <p className="text-sm capitalize">{crianca.sexo}</p>
                </div>
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-sm">Preferências de CMEI:</h4>
                  <p className="text-sm">1ª Opção: <span className="font-medium">{crianca.cmei1_preferencia}</span></p>
                  {crianca.cmei2_preferencia && <p className="text-sm">2ª Opção: <span className="font-medium">{crianca.cmei2_preferencia}</span></p>}
                </div>
              </div>

              {/* Coluna 2: Responsável */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0 border-border">
                <h3 className="text-lg font-semibold text-primary">Responsável</h3>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{crianca.responsavel_nome}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium">CPF:</span>
                  <p className="text-sm">{crianca.responsavel_cpf}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">{crianca.responsavel_telefone}</p>
                </div>
                {crianca.responsavel_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">{crianca.responsavel_email}</p>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />

            {/* Endereço e Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Endereço</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                <p className="text-sm">
                  {crianca.endereco || 'Não informado'}
                  {crianca.bairro && `, Bairro: ${crianca.bairro}`}
                </p>
              </div>
              {crianca.observacoes && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium text-foreground">Observações:</p>
                  <p className="text-muted-foreground">{crianca.observacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico da Criança
            </CardTitle>
            <CardDescription>Registro de todas as ações importantes no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistorico ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-lg text-muted-foreground">Carregando histórico...</p>
                </div>
            ) : (
                <ol className="relative border-l border-border ml-2 space-y-6">
                {historicoData && historicoData.length > 0 ? (
                    historicoData.map((entry, index) => (
                    <li key={index} className="ml-6">
                        <span className="absolute flex items-center justify-center w-3 h-3 bg-primary rounded-full -left-1.5 ring-4 ring-background"></span>
                        <div className="p-3 bg-card border border-border rounded-lg shadow-sm">
                        <time className="mb-1 text-xs font-normal leading-none text-muted-foreground">
                            {/* Usamos created_at para o timestamp completo */}
                            {format(parseISO(entry.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </time>
                        <h3 className="text-base font-semibold text-foreground mt-1">{entry.acao}</h3>
                        <p className="text-sm font-normal text-muted-foreground">{entry.detalhes}</p>
                        <p className="text-xs mt-1 text-gray-500">Usuário: {entry.usuario}</p>
                        </div>
                    </li>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-4">Nenhum histórico encontrado.</p>
                )}
                </ol>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Convocação/Reconvocação */}
      <Dialog open={isConvocarModalOpen} onOpenChange={setIsConvocarModalOpen}>
        {crianca && (
          <ConvocarModal 
            crianca={crianca} 
            onClose={handleConvocarSuccess}
          />
        )}
      </Dialog>
      
      {/* Modal de Justificativa */}
      <Dialog open={isJustificativaModalOpen} onOpenChange={setIsJustificativaModalOpen}>
        {crianca && currentJustificativaAction && (
          <JustificativaModal
            {...getJustificativaProps(currentJustificativaAction)}
            onConfirm={handleJustificativaConfirm}
            onClose={() => {
              setIsJustificativaModalOpen(false);
              setCurrentJustificativaAction(undefined);
            }}
          />
        )}
      </Dialog>
    </AdminLayout>
  );
};

export default DetalhesCrianca;