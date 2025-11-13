import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Bell, XCircle, Eye, Loader2, Clock, RotateCcw, History, ListRestart, CheckCircle, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crianca } from "@/lib/mock-data";
import { Dialog, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import ConvocarModal from "@/components/ConvocarModal";
import JustificativaModal from "@/components/JustificativaModal"; // Importar novo modal
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Estados para gerenciar os modais de justificativa
type JustificativaAction = 'recusada' | 'desistente' | 'fim_de_fila';

const Fila = () => {
  const { 
    criancas, 
    isLoading, 
    marcarDesistente, 
    isMarkingDesistente,
    marcarFimDeFila,
    isMarkingFimDeFila,
    reativarCrianca,
    isReactivating,
    confirmarMatricula,
    isConfirmingMatricula,
    marcarRecusada,
    isMarkingRecusada,
  } = useCriancas();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cmeiFilter, setCmeiFilter] = useState("todos");
  const [prioridadeFilter, setPrioridadeFilter] = useState("todas");
  
  // Modais
  const [isConvocarModalOpen, setIsConvocarModalOpen] = useState(false);
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [criancaToConvoke, setCriancaToConvoke] = useState<Crianca | undefined>(undefined);
  const [criancaToJustify, setCriancaToJustify] = useState<Crianca | undefined>(undefined);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);


  const filteredFila = useMemo(() => {
    if (!criancas) return [];

    let filtered = criancas.filter(c => c.status === "Fila de Espera" || c.status === "Convocado");

    // 1. Apply CMEI filter (based on cmei1 preference)
    if (cmeiFilter !== "todos") {
      filtered = filtered.filter(c => c.cmei1 === cmeiFilter);
    }

    // 2. Apply Priority filter
    if (prioridadeFilter === "prioridade") {
      filtered = filtered.filter(c => c.programasSociais === "sim");
    } else if (prioridadeFilter === "normal") {
      filtered = filtered.filter(c => c.programasSociais === "nao");
    }
    
    // 3. Apply Search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(lowerCaseSearch) ||
        c.responsavel.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Separate Fila de Espera and Convocados
    const filaDeEspera = filtered.filter(c => c.status === "Fila de Espera");
    const convocados = filtered.filter(c => c.status === "Convocado");

    // Sort Fila de Espera (by priority then by inscription date/dataNascimento)
    filaDeEspera.sort((a, b) => {
        // Priority sort: 'sim' comes before 'nao'
        if (a.programasSociais === 'sim' && b.programasSociais === 'nao') return -1;
        if (a.programasSociais === 'nao' && b.programasSociais === 'sim') return 1;
        
        // Secondary sort: Oldest child first (using dataNascimento for stable sorting)
        return new Date(a.dataNascimento).getTime() - new Date(b.dataNascimento).getTime();
    });

    // Assign dynamic position for Fila de Espera
    const sortedFila = filaDeEspera.map((c, index) => ({
        ...c,
        posicaoFila: index + 1,
    }));
    
    // Convocados should appear first, sorted by deadline (closest deadline first)
    convocados.sort((a, b) => {
        if (!a.convocacaoDeadline) return 1;
        if (!b.convocacaoDeadline) return -1;
        return new Date(a.convocacaoDeadline).getTime() - new Date(b.convocacaoDeadline).getTime();
    });

    return [...convocados, ...sortedFila];

  }, [criancas, cmeiFilter, prioridadeFilter, searchTerm]);
  
  const historicoCriancas = useMemo(() => {
    return criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada" || c.status === "Desistente" || c.status === "Recusada");
  }, [criancas]);

  const stats = useMemo(() => {
    const totalFila = criancas.filter(c => c.status === "Fila de Espera").length;
    const comPrioridade = criancas.filter(c => c.status === "Fila de Espera" && c.programasSociais === "sim").length;
    const convocados = criancas.filter(c => c.status === "Convocado").length;

    return { totalFila, comPrioridade, convocados };
  }, [criancas]);

  const getPriorityLabel = (crianca: Crianca) => {
    if (crianca.programasSociais === "sim") {
      return "Prioridade Social";
    }
    if (crianca.cmei2) return "Múltipla Opção";
    return "Normal";
  };

  const getInscriptionDate = (crianca: Crianca) => {
    const inscriptionEntry = crianca.historico.find(h => h.acao.includes("Inscrição Inicial"));
    if (inscriptionEntry) {
      try {
        return format(parseISO(inscriptionEntry.data), 'dd/MM/yyyy', { locale: ptBR });
      } catch (e) {
        return 'N/A';
      }
    }
    return 'N/A';
  };
  
  const getFinalizationDate = (crianca: Crianca) => {
    const finalizationEntry = crianca.historico.find(h => 
      h.acao.includes("Matrícula Efetivada") || h.acao.includes("Marcado como Desistente") || h.acao.includes("Convocação Recusada")
    );
    if (finalizationEntry) {
      try {
        return format(parseISO(finalizationEntry.data), 'dd/MM/yyyy', { locale: ptBR });
      } catch (e) {
        return 'N/A';
      }
    }
    return 'N/A';
  };
  
  const getDeadlineInfo = (deadline: string) => {
    const deadlineDate = parseISO(deadline);
    const today = new Date();
    const daysRemaining = differenceInDays(deadlineDate, today);
    
    const isExpired = daysRemaining < 0;

    if (isExpired) {
        return {
            text: `Prazo Expirado (${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })})`,
            className: "bg-destructive/20 text-destructive",
            icon: XCircle,
            isExpired: true,
        };
    }
    
    return {
        text: `Prazo: ${daysRemaining} dias (${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })})`,
        className: "bg-accent/20 text-foreground",
        icon: Clock,
        isExpired: false,
    };
  };
  
  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary text-secondary-foreground", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary text-secondary-foreground", text: "Matriculado" },
      "Fila de Espera": { className: "bg-accent/20 text-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
    };
    
    const config = variants[status] || { className: "bg-muted text-muted-foreground", text: status };
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  const handleConvocarClick = (crianca: Crianca) => {
    setCriancaToConvoke(crianca);
    setIsConvocarModalOpen(true);
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
    
    switch (currentJustificativaAction) {
      case 'recusada':
        await marcarRecusada({ id, justificativa });
        break;
      case 'desistente':
        await marcarDesistente({ id, justificativa });
        break;
      case 'fim_de_fila':
        await marcarFimDeFila({ id, justificativa });
        break;
    }
  };
  
  const getJustificativaProps = (action: JustificativaAction) => {
    const criancaNome = criancaToJustify?.nome || 'a criança';
    switch (action) {
      case 'recusada':
        return {
          title: `Recusar Convocação de ${criancaNome}`,
          description: "Confirme a recusa da convocação. A criança será marcada como 'Recusada'.",
          actionLabel: "Confirmar Recusa",
          isPending: isMarkingRecusada,
        };
      case 'desistente':
        return {
          title: `Marcar ${criancaNome} como Desistente`,
          description: "Confirme a desistência. A criança será removida permanentemente da fila.",
          actionLabel: "Confirmar Desistência",
          isPending: isMarkingDesistente,
        };
      case 'fim_de_fila':
        return {
          title: `Marcar Fim de Fila para ${criancaNome}`,
          description: "Confirme o fim de fila. A criança será movida para o final da fila de espera.",
          actionLabel: "Confirmar Fim de Fila",
          isPending: isMarkingFimDeFila,
        };
      default:
        return { title: "", description: "", actionLabel: "", isPending: false };
    }
  };
  
  const handleReativar = async (id: number) => {
    await reativarCrianca(id);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando fila de espera...</p>
        </div>
      </AdminLayout>
    );
  }

  const allCmeiNames = Array.from(new Set(criancas.map(c => c.cmei1))).filter(Boolean);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fila de Espera e Convocações</h1>
            <p className="text-muted-foreground">Gerenciamento da fila de espera para vagas e acompanhamento de convocações</p>
          </div>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar Fila
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{stats.totalFila}</div>
              <p className="text-sm text-muted-foreground">Total na Fila</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.comPrioridade}</div>
              <p className="text-sm text-muted-foreground">Com Prioridade Social</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-secondary">{stats.convocados}</div>
              <p className="text-sm text-muted-foreground">Crianças Convocadas</p>
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
                <Select onValueChange={setPrioridadeFilter} value={prioridadeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="prioridade">Com Prioridade Social</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Posição</TableHead>
                  <TableHead>Criança</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data Insc.</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status/Prazo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFila.length > 0 ? (
                  filteredFila.map((item) => {
                    const isConvocado = item.status === "Convocado";
                    const deadlineInfo = isConvocado && item.convocacaoDeadline ? getDeadlineInfo(item.convocacaoDeadline) : null;
                    
                    return (
                      <TableRow key={item.id} className={isConvocado ? "bg-primary/5 hover:bg-primary/10" : ""}>
                        <TableCell className="font-bold text-primary">
                            {isConvocado ? <Badge className="bg-primary text-primary-foreground">CONV.</Badge> : `#${item.posicaoFila}`}
                        </TableCell>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.idade}</TableCell>
                        <TableCell>{item.responsavel}</TableCell>
                        <TableCell>{getInscriptionDate(item)}</TableCell>
                        <TableCell>
                          <Badge variant={item.programasSociais === "sim" ? "default" : "secondary"}>
                            {getPriorityLabel(item)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            {isConvocado && deadlineInfo ? (
                                <div className={`flex items-center gap-1 text-xs font-medium p-1 rounded ${deadlineInfo.className}`}>
                                    <deadlineInfo.icon className="h-3 w-3" />
                                    {deadlineInfo.text}
                                </div>
                            ) : (
                                <Badge variant="secondary">Fila de Espera</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/criancas/${item.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              
                              {/* Ações para Convocados */}
                              {isConvocado && (
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
                                          Você está confirmando a matrícula de <span className="font-semibold">{item.nome}</span> no CMEI {item.cmei}. Esta ação é irreversível.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isConfirmingMatricula}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleConfirmarMatricula(item.id)} 
                                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                          disabled={isConfirmingMatricula}
                                        >
                                          {isConfirmingMatricula ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Matrícula"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <DropdownMenuItem onSelect={() => toast.info("Reenviar notificação em desenvolvimento...")}>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Reenviar notificação
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'recusada')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Marcar como recusada (Justificativa)
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'fim_de_fila')} className="text-accent focus:bg-accent/10 focus:text-accent">
                                    <ListRestart className="mr-2 h-4 w-4" />
                                    Marcar Fim de Fila (Justificativa)
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'desistente')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Marcar como desistente (Justificativa)
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Opção de Convocar / Reconvocar */}
                              {(!isConvocado || (isConvocado && deadlineInfo?.isExpired)) && (
                                <DropdownMenuItem className="text-primary" onSelect={() => handleConvocarClick(item)}>
                                  {isConvocado ? (
                                    <>
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Reconvocar para matrícula
                                    </>
                                  ) : (
                                    <>
                                      <Bell className="mr-2 h-4 w-4" />
                                      Convocar para matrícula
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                            Nenhuma criança na fila de espera ou convocada com os filtros aplicados.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Histórico de Matrículas e Desistências */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="historico">
            <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
              <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Histórico de Matrículas e Desistências ({historicoCriancas.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criança</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Status Final</TableHead>
                        <TableHead>CMEI/Turma</TableHead>
                        <TableHead>Data Final</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoCriancas.length > 0 ? (
                        historicoCriancas.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.nome}</TableCell>
                            <TableCell>{item.responsavel}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>{item.cmei !== "N/A" ? `${item.cmei} (${item.turmaAtual || 'N/A'})` : '-'}</TableCell>
                            <TableCell>{getFinalizationDate(item)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/admin/criancas/${item.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  {(item.status === "Desistente" || item.status === "Recusada") && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-secondary focus:bg-secondary/10 focus:text-secondary">
                                          <ListRestart className="mr-2 h-4 w-4" />
                                          Reativar na Fila
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirmar Reativação?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta ação reativará <span className="font-semibold">{item.nome}</span> na fila de espera, colocando-a no final da fila.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel disabled={isReactivating}>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleReativar(item.id)} 
                                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                            disabled={isReactivating}
                                          >
                                            {isReactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Reativação"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                            Nenhum registro de matrícula ou desistência encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Modal de Convocação */}
      <Dialog open={isConvocarModalOpen} onOpenChange={setIsConvocarModalOpen}>
        {criancaToConvoke && (
          <ConvocarModal 
            crianca={criancaToConvoke} 
            onClose={() => {
                setIsConvocarModalOpen(false);
                setCriancaToConvoke(undefined);
            }} 
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

export default Fila;