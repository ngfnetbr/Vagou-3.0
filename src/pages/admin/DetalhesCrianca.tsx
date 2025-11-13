import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, MapPin, Phone, Mail, Edit, History, Loader2, FileText, CheckCircle, ListOrdered, School } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useCriancaDetails } from "@/hooks/use-criancas";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaCriancaModalContent from "@/components/NovaCriancaModal";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DetalhesCrianca = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const criancaId = id ? parseInt(id) : undefined;
  const { data: crianca, isLoading, error, refetch } = useCriancaDetails(criancaId || 0);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary text-secondary-foreground", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary text-secondary-foreground", text: "Matriculado" },
      "Fila de Espera": { className: "bg-accent/20 text-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
    };
    
    const config = variants[status] || { className: "bg-muted text-muted-foreground", text: status };
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  const handleEditSuccess = () => {
    setIsModalOpen(false);
    refetch(); // Refresh data after successful edit/delete
    if (criancaId && !crianca) { // If deleted, navigate back
        navigate('/admin/criancas');
    }
  };

  const isMatriculado = crianca.status === 'Matriculado' || crianca.status === 'Matriculada';
  const isFila = crianca.status === 'Fila de Espera';

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
          <div className="flex gap-2">
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
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Dados
                </Button>
              </DialogTrigger>
              <NovaCriancaModalContent 
                onClose={() => setIsModalOpen(false)} 
                initialData={crianca}
              />
            </Dialog>
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
                  ? `Matriculado(a) no ${crianca.cmei}` 
                  : crianca.status === 'Convocado' 
                  ? `Aguardando resposta para ${crianca.cmei}`
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
              {isMatriculado && crianca.turmaAtual ? (
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Turma: {crianca.turmaAtual}</p>
                </div>
              ) : isFila && crianca.posicaoFila !== undefined ? (
                <div className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium">Posição na Fila: #{crianca.posicaoFila}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma turma ou posição na fila definida.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Critérios de Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={crianca.programasSociais === 'sim' ? 'default' : 'secondary'}>
                {crianca.programasSociais === 'sim' ? 'Beneficiário Social' : 'Sem Prioridade Social'}
              </Badge>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className={`h-4 w-4 ${crianca.aceitaQualquerCmei === 'sim' ? 'text-secondary' : 'text-destructive'}`} />
                <p className="text-sm text-muted-foreground">
                  Aceita qualquer CMEI: <span className="font-medium capitalize">{crianca.aceitaQualquerCmei === 'sim' ? 'Sim' : 'Não'}</span>
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
                  <p className="text-sm">Data Nasc.: {crianca.dataNascimento}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium">Sexo:</span>
                  <p className="text-sm capitalize">{crianca.sexo}</p>
                </div>
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-sm">Preferências de CMEI:</h4>
                  <p className="text-sm">1ª Opção: <span className="font-medium">{crianca.cmei1}</span></p>
                  {crianca.cmei2 && <p className="text-sm">2ª Opção: <span className="font-medium">{crianca.cmei2}</span></p>}
                </div>
              </div>

              {/* Coluna 2: Responsável */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0 border-border">
                <h3 className="text-lg font-semibold text-primary">Responsável</h3>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{crianca.responsavel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-medium">CPF:</span>
                  <p className="text-sm">{crianca.cpfResponsavel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">{crianca.telefoneResponsavel}</p>
                </div>
                {crianca.emailResponsavel && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">{crianca.emailResponsavel}</p>
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
            <ol className="relative border-l border-border ml-2 space-y-6">
              {crianca.historico.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((entry, index) => (
                <li key={index} className="ml-6">
                  <span className="absolute flex items-center justify-center w-3 h-3 bg-primary rounded-full -left-1.5 ring-4 ring-background"></span>
                  <div className="p-3 bg-card border border-border rounded-lg shadow-sm">
                    <time className="mb-1 text-xs font-normal leading-none text-muted-foreground">
                      {format(new Date(entry.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    </time>
                    <h3 className="text-base font-semibold text-foreground mt-1">{entry.acao}</h3>
                    <p className="text-sm font-normal text-muted-foreground">{entry.detalhes}</p>
                    <p className="text-xs mt-1 text-gray-500">Usuário: {entry.usuario}</p>
                  </div>
                </li>
              ))}
            </ol>
            {crianca.historico.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum histórico encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DetalhesCrianca;