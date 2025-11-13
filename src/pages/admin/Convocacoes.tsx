import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Send, Eye, CheckCircle, XCircle, Loader2, MoreVertical, RotateCcw, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { Crianca } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog } from "@/components/ui/dialog";
import ConvocarModal from "@/components/ConvocarModal";
import JustificativaModal from "@/components/JustificativaModal";
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

type JustificativaAction = 'recusada' | 'fim_de_fila';

const Convocacoes = () => {
  const { 
    criancas, 
    isLoading, 
    confirmarMatricula, 
    isConfirmingMatricula, 
    marcarRecusada, 
    isMarkingRecusada,
    marcarFimDeFila,
    isMarkingFimDeFila,
  } = useCriancas();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cmeiFilter, setCmeiFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  
  const [isConvocarModalOpen, setIsConvocarModalOpen] = useState(false);
  const [criancaToConvoke, setCriancaToConvoke] = useState<Crianca | undefined>(undefined);
  
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [criancaToJustify, setCriancaToJustify] = useState<Crianca | undefined>(undefined);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);

  const convocacoesAtivas = useMemo(() => {
    let filtered = criancas.filter(c => c.status === "Convocado" || c.status === "Recusada");

    if (cmeiFilter !== "todos") {
      filtered = filtered.filter(c => c.cmei === cmeiFilter);
    }

    if (statusFilter !== "todos") {
      // Mapeia 'Pendente' para 'Convocado' no mock
      const targetStatus = statusFilter === 'pendente' ? 'Convocado' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      filtered = filtered.filter(c => c.status === targetStatus);
    }
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(lowerCaseSearch) ||
        c.responsavel.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Ordena: Convocados com prazo expirado primeiro, depois por prazo mais próximo
    filtered.sort((a, b) => {
        const aDeadline = a.convocacaoDeadline ? parseISO(a.convocacaoDeadline).getTime() : Infinity;
        const bDeadline = b.convocacaoDeadline ? parseISO(b.convocacaoDeadline).getTime() : Infinity;
        
        const now = new Date().getTime();
        const aExpired = aDeadline < now;
        const bExpired = bDeadline < now;
        
        if (aExpired && !bExpired) return -1;
        if (!aExpired && bExpired) return 1;
        
        return aDeadline - bDeadline;
    });

    return filtered;
  }, [criancas, cmeiFilter, statusFilter, searchTerm]);
  
  const allCmeiNames = useMemo(() => Array.from(new Set(criancas.map(c => c.cmei1))).filter(Boolean), [criancas]);

  const stats = useMemo(() => {
    const allConvocacoes = criancas.filter(c => c.status === "Convocado" || c.status === "Recusada" || c.status === "Matriculado" || c.status === "Matriculada");
    
    const pendentes = allConvocacoes.filter(c => c.status === "Convocado").length;
    const confirmadas = allConvocacoes.filter(c => c.status === "Matriculado" || c.status === "Matriculada").length;
    const recusadas = allConvocacoes.filter(c => c.status === "Recusada").length;
    
    return { pendentes, confirmadas, recusadas };
  }, [criancas]);

  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { className: string, text: string }> = {
      "Convocado": { className: "bg-accent/20 text-foreground", text: "Pendente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
      "Matriculada": { className: "bg-secondary/20 text-secondary", text: "Confirmada" },
      "Matriculado": { className: "bg-secondary/20 text-secondary", text: "Confirmada" },
      "Trancada": { className: "bg-destructive/20 text-destructive", text: "Trancada" },
      "Remanejamento Solicitado": { className: "bg-accent/20 text-foreground", text: "Remanejamento Solicitado" },
      // Fallback para outros status que podem aparecer no filtro
      "Fila de Espera": { className: "bg-muted/50 text-muted-foreground", text: "Fila de Espera" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
    };
    
    const config = variants[status] || { className: "bg-muted/50 text-muted-foreground", text: status };
    return <Badge className={config.className}>{config.text}</Badge>;
  };
  
  const getDeadlineInfo = (deadline: string) => {
    const deadlineDate = parseISO(deadline + 'T00:00:00');
    const today = new Date();
    const daysRemaining = differenceInDays(deadlineDate, today);
    
    const isExpired = daysRemaining < 0;

    if (isExpired) {
        return {
            text: `Expirado em ${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })}`,
            className: "text-destructive",
            isExpired: true,
        };
    }
    
    return {
        text: `Até ${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })} (${daysRemaining} dias)`,
        className: "text-foreground",
        isExpired: false,
    };
  };
  
  const getConvocationDate = (crianca: Crianca) => {
    const convocationEntry = crianca.historico.find(h => h.acao.includes("Convocação Enviada"));
    if (convocationEntry) {
      try {
        return format(parseISO(convocationEntry.data), 'dd/MM/yyyy', { locale: ptBR });
      } catch (e) {
        return 'N/A';
      }
    }
    return 'N/A';
  };

  // --- Handlers ---
  
  const handleExport = () => {
    toast.success("Exportação de Convocações iniciada!", {
      description: "O arquivo de convocações será gerado e baixado em breve.",
    });
  };
  
  const handleConvocarClick = (crianca: Crianca) => {
    setCriancaToConvoke(crianca);
    setIsConvocarModalOpen(true);
  };
  
  const handleConvocarSuccess = () => {
    setIsConvocarModalOpen(false);
    setCriancaToConvoke(undefined);
  };
  
  const handleConfirmarMatricula = async (id: number) => {
    await confirmarMatricula(id);
  };
  
  const handleJustificativaAction = (crianca: Crianca, action: JustificativaAction) => {
    setCriancaToJustify(crianca);
    setCurrentJustificativaAction(action);
    setIsJustificativaModalOpen(true);
  };
  
  const handleJustificativaConfirm = async (justificativa: string) => {
    if (!criancaToJustify || !currentJustificativaAction) return;
    
    const id = criancaToJustify.id;
    
    try {
        if (currentJustificativaAction === 'recusada') {
            await marcarRecusada({ id, justificativa });
        } else if (currentJustificativaAction === 'fim_de_fila') {
            await marcarFimDeFila({ id, justificativa });
        }
        
        setIsJustificativaModalOpen(false);
        setCriancaToJustify(undefined);
        setCurrentJustificativaAction(undefined);
    } catch (e) {
        // Erro tratado pelo hook
    }
  };
  
  const getJustificativaProps = (action: JustificativaAction) => {
    const criancaNome = criancaToJustify?.nome || 'a criança';
    const isPending = action === 'recusada' ? isMarkingRecusada : isMarkingFimDeFila;
                      
    switch (action) {
      case 'recusada':
        return {
          title: `Recusar Convocação de ${criancaNome}`,
          description: "Confirme a recusa da convocação. A criança será marcada como 'Recusada'.",
          actionLabel: "Confirmar Recusa",
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
  
  const handleReenviarNotificacao = () => {
    toast.info("Reenvio de notificação em desenvolvimento...", {
        description: "A notificação será reenviada ao responsável em breve."
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando convocações...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Convocações</h1>
            <p className="text-muted-foreground">Gerenciamento de convocações para matrícula</p>
          </div>
          <div className="flex gap-2">
            <Button 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => navigate('/admin/fila')} // Redireciona para a fila para iniciar nova convocação
            >
              <Send className="mr-2 h-4 w-4" />
              Nova Convocação
            </Button>
            <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10"
                onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-accent">{stats.pendentes}</div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-secondary">{stats.confirmadas}</div>
              <p className="text-sm text-muted-foreground">Confirmadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{stats.recusadas}</div>
              <p className="text-sm text-muted-foreground">Recusadas</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome da criança ou responsável..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select onValueChange={setCmeiFilter} value={cmeiFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por CMEI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os CMEIs</SelectItem>
                    {allCmeiNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="recusada">Recusada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criança</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>CMEI / Turma</TableHead>
                  <TableHead>Data Convocação</TableHead>
                  <TableHead>Prazo Resposta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convocacoesAtivas.length > 0 ? (
                    convocacoesAtivas.map((convocacao) => {
                        const isConvocado = convocacao.status === "Convocado";
                        const deadlineInfo = isConvocado && convocacao.convocacaoDeadline ? getDeadlineInfo(convocacao.convocacaoDeadline) : null;
                        
                        return (
                            <TableRow key={convocacao.id} className={isConvocado && deadlineInfo?.isExpired ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                                <TableCell className="font-medium">{convocacao.nome}</TableCell>
                                <TableCell>{convocacao.responsavel}</TableCell>
                                <TableCell>{convocacao.cmei} ({convocacao.turmaAtual || '-'})</TableCell>
                                <TableCell>{getConvocationDate(convocacao)}</TableCell>
                                <TableCell>
                                    {deadlineInfo ? (
                                        <div className={`flex items-center gap-1 text-sm font-medium ${deadlineInfo.className}`}>
                                            <Clock className="h-4 w-4" />
                                            {deadlineInfo.text}
                                        </div>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>{getStatusBadge(convocacao.status)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => navigate(`/admin/criancas/${convocacao.id}`)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ver detalhes
                                            </DropdownMenuItem>
                                            
                                            {convocacao.status === "Convocado" && (
                                                <>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-secondary focus:bg-secondary/10 focus:text-secondary" disabled={isConfirmingMatricula}>
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Confirmar matrícula
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirmar Matrícula?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Você está confirmando a matrícula de <span className="font-semibold">{convocacao.nome}</span> no CMEI {convocacao.cmei}. Esta ação é irreversível.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel disabled={isConfirmingMatricula}>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    onClick={() => handleConfirmarMatricula(convocacao.id)} 
                                                                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                                                    disabled={isConfirmingMatricula}
                                                                >
                                                                    {isConfirmingMatricula ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Matrícula"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    
                                                    <DropdownMenuItem onClick={() => handleJustificativaAction(convocacao, 'recusada')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Marcar como recusada
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuItem onClick={() => handleJustificativaAction(convocacao, 'fim_de_fila')} className="text-accent focus:bg-accent/10 focus:text-accent">
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Marcar Fim de Fila
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            
                                            {/* Reconvocar se for Convocado (expirado) ou Recusada */}
                                            {(convocacao.status === "Recusada" || (isConvocado && deadlineInfo?.isExpired)) && (
                                                <DropdownMenuItem onClick={() => handleConvocarClick(convocacao)} className="text-primary focus:bg-primary/10 focus:text-primary">
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Reconvocar
                                                </DropdownMenuItem>
                                            )}
                                            
                                            <DropdownMenuItem onClick={handleReenviarNotificacao}>
                                                <Send className="mr-2 h-4 w-4" />
                                                Reenviar notificação
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            Nenhuma convocação ativa ou recusada encontrada com os filtros aplicados.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Convocação/Reconvocação */}
      <Dialog open={isConvocarModalOpen} onOpenChange={setIsConvocarModalOpen}>
        {criancaToConvoke && (
          <ConvocarModal 
            crianca={criancaToConvoke} 
            onClose={handleConvocarSuccess}
          />
        )}
      </Dialog>
      
      {/* Modal de Justificativa */}
      <Dialog open={isJustificativaModalOpen} onOpenChange={setIsJustificativaModalOpen}>
        {criancaToJustify && currentJustificativaAction && (
          <JustificativaModal
            {...getJustificativaProps(currentJustificativaAction)}
            onConfirm={handleJustificativaConfirm}
            onClose={() => {
              setIsJustificativaModalOpen(false);
              setCriancaToJustify(undefined);
              setCurrentJustificativaAction(undefined);
            }}
          />
        )}
      </Dialog>
    </AdminLayout>
  );
};

export default Convocacoes;