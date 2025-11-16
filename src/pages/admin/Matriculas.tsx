import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MoreVertical, Loader2, Eye, Trash2, RotateCcw, ArrowRight, ListRestart, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import JustificativaModal from "@/components/JustificativaModal";
import RealocacaoModal from "@/components/RealocacaoModal";
import RemanejamentoModal from "@/components/RemanejamentoModal"; // NOVO MODAL
import { Crianca, ConvocationData } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { HistoricoMatriculasAccordion } from "@/components/matriculas/HistoricoMatriculasAccordion";

const mockTurmas = [
  "Berçário I", "Berçário II", "Maternal I", "Maternal II", "Pré I", "Pré II"
];

type JustificativaAction = 'desistente' | 'transferir'; // Remanejamento sai daqui
type VagaAction = 'realocar';
type RemanejamentoAction = 'solicitar'; // Nova ação

const Matriculas = () => {
  const { 
    criancas, 
    isLoading, 
    marcarDesistente, 
    isMarkingDesistente,
    realocarCrianca,
    isRealocating,
    transferirCrianca,
    isTransferring,
    solicitarRemanejamento, // Usando a nova função
    isRequestingRemanejamento,
    reativarCrianca,
    isReactivating,
  } = useCriancas();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cmeiFilter, setCmeiFilter] = useState("todos");
  const [turmaFilter, setTurmaFilter] = useState("todas");
  
  // Modais State
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [criancaToJustify, setCriancaToJustify] = useState<Crianca | undefined>(undefined);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);
  
  const [isVagaModalOpen, setIsVagaModalOpen] = useState(false);
  const [criancaToVaga, setCriancaToVaga] = useState<Crianca | undefined>(undefined);
  const [currentVagaAction, setCurrentVagaAction] = useState<VagaAction | undefined>(undefined);
  
  // Novo estado para Remanejamento
  const [isRemanejamentoModalOpen, setIsRemanejamentoModalOpen] = useState(false);
  const [criancaToRemanejamento, setCriancaToRemanejamento] = useState<Crianca | undefined>(undefined);


  const { matriculasAtivas, historicoEncerradas } = useMemo(() => {
    const matriculasAtivas = criancas.filter(c => 
        c.status === "Matriculado" || 
        c.status === "Matriculada" || 
        c.status === "Remanejamento Solicitado"
    ).filter(c => {
        if (cmeiFilter !== "todos" && c.cmeiNome !== cmeiFilter) return false;
        if (turmaFilter !== "todas" && c.turmaNome && c.turmaNome.includes(turmaFilter)) return false;
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            if (!c.nome.toLowerCase().includes(lowerCaseSearch) && !c.responsavel_nome.toLowerCase().includes(lowerCaseSearch)) return false;
        }
        return true;
    });
    
    const historicoEncerradas = criancas.filter(c => 
        c.status === "Desistente" || c.status === "Recusada"
    );

    return { matriculasAtivas, historicoEncerradas };
  }, [criancas, cmeiFilter, turmaFilter, searchTerm]);
  
  // Get list of unique CMEIs where children are currently matriculated
  const allCmeiNames = useMemo(() => Array.from(new Set(criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada" || c.status === "Remanejamento Solicitado").map(c => c.cmeiNome))).filter(name => name), [criancas]);

  // --- Handlers para Modais de Vaga (Realocar) ---
  
  const handleVagaActionClick = (crianca: Crianca, action: VagaAction) => {
    setCriancaToVaga(crianca);
    setCurrentVagaAction(action);
    setIsVagaModalOpen(true);
  };
  
  const handleVagaConfirm = async (id: string, vagaString: string) => {
    const parts = vagaString.split('|');
    if (parts.length !== 4) {
        throw new Error("Formato de vaga inválido."); 
    }
    const [cmei_id, turma_id] = parts;
    
    const data: ConvocationData = { cmei_id, turma_id };
    
    await realocarCrianca({ id, data });
  };
  
  // --- Handlers para Modais de Justificativa (Desistente/Transferir) ---

  const handleJustificativaActionClick = (crianca: Crianca, action: JustificativaAction) => {
    setCriancaToJustify(crianca);
    setCurrentJustificativaAction(action);
    setIsJustificativaModalOpen(true);
  };
  
  const handleJustificativaConfirm = async (justificativa: string) => {
    if (!criancaToJustify || !currentJustificativaAction) return;
    
    const id = criancaToJustify.id;
    
    try {
        switch (currentJustificativaAction) {
          case 'desistente':
            await marcarDesistente({ id, justificativa });
            break;
          case 'transferir':
            await transferirCrianca({ id, justificativa });
            break;
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
    
    switch (action) {
      case 'desistente':
        return {
          title: `Marcar ${criancaNome} como Desistente`,
          description: "Confirme a desistência. A criança será marcada como 'Desistente' e removida da lista de matrículas ativas.",
          actionLabel: "Confirmar Desistência",
          isPending: isMarkingDesistente,
          actionVariant: 'destructive' as const,
        };
      case 'transferir':
        return {
          title: `Transferir ${criancaNome} (Mudança de Cidade)`,
          description: "Confirme a transferência por mudança de cidade. A matrícula será encerrada e a criança marcada como desistente.",
          actionLabel: "Confirmar Transferência",
          isPending: isTransferring,
          actionVariant: 'destructive' as const,
        };
      default:
        return { title: "", description: "", actionLabel: "", isPending: false, actionVariant: 'destructive' as const };
    }
  };
  
  // --- Handlers para Remanejamento ---
  
  const handleRemanejamentoActionClick = (crianca: Crianca) => {
    setCriancaToRemanejamento(crianca);
    setIsRemanejamentoModalOpen(true);
  };
  
  const handleRemanejamentoConfirm = async (criancaId: string, cmeiId: string, cmeiNome: string, justificativa: string) => {
    await solicitarRemanejamento({ id: criancaId, cmeiId, cmeiNome, justificativa });
    // O hook useCriancas já invalida as queries e mostra o toast
  };
  
  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary/20 text-secondary", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary/20 text-secondary", text: "Matriculado" },
      "Remanejamento Solicitado": { className: "bg-primary/20 text-primary", text: "Remanejamento Solicitado" }, // Cor alterada para primária
      // Fallbacks
      "Fila de Espera": { className: "bg-muted/50 text-muted-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-accent/20 text-foreground", text: "Convocado" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
    };
    
    const config = variants[status] || { className: "bg-muted/50 text-muted-foreground", text: status };
    return <Badge className={config.className}>{config.text}</Badge>;
  };
  
  const handleViewDetails = (id: string) => {
    navigate(`/admin/criancas/${id}`);
  };
  
  const handleReativar = async (id: string) => {
    await reativarCrianca(id);
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando matrículas ativas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Matrículas</h1>
            <p className="text-muted-foreground">Gerenciamento completo de matrículas ativas</p>
          </div>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => toast.info("Exportação em desenvolvimento...")}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
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
                <Select onValueChange={setTurmaFilter} value={turmaFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {mockTurmas.map(turma => (
                        <SelectItem key={turma} value={turma}>{turma}</SelectItem>
                    ))}
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
                  <TableHead>CMEI</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculasAtivas.length > 0 ? (
                    matriculasAtivas.map((matricula) => (
                      <TableRow key={matricula.id}>
                        <TableCell className="font-medium">{matricula.nome}</TableCell>
                        <TableCell>{matricula.responsavel_nome}</TableCell>
                        <TableCell>{matricula.cmeiNome || '-'}</TableCell>
                        <TableCell>{matricula.turmaNome || '-'}</TableCell>
                        <TableCell>
                          {getStatusBadge(matricula.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(matricula.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              
                              {/* Ações que exigem nova vaga (Realocar) */}
                              {(matricula.status === "Matriculado" || matricula.status === "Matriculada") && (
                                <>
                                  <DropdownMenuItem onClick={() => handleVagaActionClick(matricula, 'realocar')}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Realocar (Mudar Turma)
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Ações de Remanejamento e Saída */}
                              {(matricula.status === "Matriculado" || matricula.status === "Matriculada") && (
                                <>
                                  <DropdownMenuItem onClick={() => handleRemanejamentoActionClick(matricula)} className="text-primary focus:bg-primary/10 focus:text-primary">
                                    <Bell className="mr-2 h-4 w-4" />
                                    Solicitar Remanejamento
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleJustificativaActionClick(matricula, 'transferir')}
                                  >
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Transferir (Mudança de Cidade)
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleJustificativaActionClick(matricula, 'desistente')}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Marcar como desistente
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Nenhuma matrícula ativa encontrada com os filtros aplicados.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Histórico de Matrículas Encerradas */}
        <HistoricoMatriculasAccordion
            historicoEncerradas={historicoEncerradas}
            isReactivating={isReactivating}
            handleReativar={handleReativar}
            getStatusBadge={getStatusBadge}
        />
      </div>
      
      {/* Modal de Justificativa (Desistente, Transferir) */}
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
      
      {/* Modal de Realocação */}
      <Dialog open={isVagaModalOpen} onOpenChange={setIsVagaModalOpen}>
        {criancaToVaga && currentVagaAction && (
          <RealocacaoModal
            crianca={criancaToVaga}
            onConfirm={handleVagaConfirm}
            onClose={() => {
              setIsVagaModalOpen(false);
              setCriancaToVaga(undefined);
              setCurrentVagaAction(undefined);
            }}
            isPending={isRealocating}
          />
        )}
      </Dialog>
      
      {/* Modal de Remanejamento (NOVO) */}
      <Dialog open={isRemanejamentoModalOpen} onOpenChange={setIsRemanejamentoModalOpen}>
        {criancaToRemanejamento && (
          <RemanejamentoModal
            crianca={criancaToRemanejamento}
            onConfirm={handleRemanejamentoConfirm}
            onClose={() => {
              setIsRemanejamentoModalOpen(false);
              setCriancaToRemanejamento(undefined);
            }}
            isPending={isRequestingRemanejamento}
          />
        )}
      </Dialog>
    </AdminLayout>
  );
};

export default Matriculas;