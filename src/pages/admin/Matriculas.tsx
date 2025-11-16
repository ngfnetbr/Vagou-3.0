import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MoreVertical, Loader2, Eye, Trash2, RotateCcw, ArrowRight, ListRestart } from "lucide-react";
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
import { Crianca, ConvocationData } from "@/integrations/supabase/types"; // Importação atualizada
import { Badge } from "@/components/ui/badge";
import { HistoricoMatriculasAccordion } from "@/components/matriculas/HistoricoMatriculasAccordion";

const mockTurmas = [
  "Berçário I", "Berçário II", "Maternal I", "Maternal II", "Pré I", "Pré II"
];

type JustificativaAction = 'desistente' | 'remanejamento' | 'transferir';
type VagaAction = 'realocar';

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
    solicitarRemanejamento,
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


  const { matriculasAtivas, historicoEncerradas } = useMemo(() => {
    const matriculasAtivas = criancas.filter(c => 
        c.status === "Matriculado" || 
        c.status === "Matriculada" || 
        c.status === "Remanejamento Solicitado"
    ).filter(c => {
        if (cmeiFilter !== "todos" && c.cmeiNome !== cmeiFilter) return false;
        if (turmaFilter !== "todas" && c.turmaNome && c.turmaNome.includes(turmaFilter)) return false; // Corrigido: verifica se turmaNome existe antes de usar includes
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            if (!c.nome.toLowerCase().includes(lowerCaseSearch) && !c.responsavel_nome.toLowerCase().includes(lowerCaseSearch)) return false;
        }
        return true;
    });
    
    // Histórico: Crianças que estão em status final (Desistente ou Recusada) E que já tiveram um CMEI/Turma atribuído.
    // Para ser mais robusto, vamos considerar que se a criança tem status final, ela deve aparecer no histórico de matrículas
    // SE ela já teve um CMEI/Turma atribuído (mesmo que os campos cmei_atual_id/turma_atual_id tenham sido limpos na mutação).
    // Como não temos um campo 'cmei_anterior' no DB, vamos confiar que se ela está em status final, mas não está na fila/convocação, ela é histórico.
    
    // Para simplificar e garantir que o histórico de matrículas só mostre encerramentos de matrículas ativas:
    // Vamos filtrar todas as crianças em status final (Desistente/Recusada) e confiar que a lógica de negócio garante que
    // se elas foram marcadas como desistentes/recusadas, elas vieram de um contexto de matrícula/convocação.
    // No entanto, para evitar duplicidade com o histórico da Fila, vamos usar a lógica de que se a criança tem um CMEI/Turma atual (mesmo que nulo após a desistência), ela é histórico de matrícula.
    
    // Vamos usar a lógica original, mas com a ressalva de que os IDs podem ser nulos após a desistência.
    // Como não temos um campo 'cmei_anterior' no DB, vamos manter a lógica de que se ela está em status final, ela é histórico de matrícula.
    
    // REVISÃO: A lógica mais segura é: se o status é Desistente ou Recusada, ela é histórico.
    // A distinção entre histórico da Fila e Histórico de Matrículas é feita pelo contexto da ação.
    // Na página de Matrículas, queremos ver os encerramentos de matrículas.
    
    // Vamos manter a lógica original, mas com a ressalva de que os IDs podem ser nulos após a desistência.
    // Se a criança foi marcada como desistente/recusada, ela deve aparecer aqui.
    const historicoEncerradas = criancas.filter(c => 
        c.status === "Desistente" || c.status === "Recusada"
    );

    return { matriculasAtivas, historicoEncerradas };
  }, [criancas, cmeiFilter, turmaFilter, searchTerm]);
  
  // Get list of unique CMEIs where children are currently matriculated
  const allCmeiNames = useMemo(() => Array.from(new Set(criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada").map(c => c.cmeiNome))).filter(name => name), [criancas]);

  // --- Handlers para Modais de Vaga (Realocar) ---
  
  const handleVagaActionClick = (crianca: Crianca, action: VagaAction) => {
    setCriancaToVaga(crianca);
    setCurrentVagaAction(action);
    setIsVagaModalOpen(true);
  };
  
  const handleVagaConfirm = async (id: string, data: ConvocationData) => {
    // Apenas Realocar usa este modal agora
    await realocarCrianca({ id, data });
    
    setIsVagaModalOpen(false);
    setCriancaToVaga(undefined);
    setCurrentVagaAction(undefined);
  };
  
  // --- Handlers para Modais de Justificativa (Desistente/Remanejamento/Transferir) ---

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
          case 'remanejamento':
            await solicitarRemanejamento({ id, justificativa });
            break;
          case 'transferir':
            // Transferir agora é uma ação de saída do sistema (mudança de cidade)
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
      case 'remanejamento':
        return {
          title: `Solicitar Remanejamento para ${criancaNome}`,
          description: "Descreva o motivo da solicitação de remanejamento. O status da criança será atualizado.",
          actionLabel: "Solicitar Remanejamento",
          isPending: isRequestingRemanejamento,
          actionVariant: 'secondary' as const,
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
  
  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary/20 text-secondary", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary/20 text-secondary", text: "Matriculado" },
      "Remanejamento Solicitado": { className: "bg-accent/20 text-foreground", text: "Remanejamento Solicitado" },
      // Fallbacks
      "Fila de Espera": { className: "bg-muted/50 text-muted-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
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
                              
                              {/* Ações que exigem justificativa */}
                              {(matricula.status === "Matriculado" || matricula.status === "Matriculada") && (
                                <>
                                  <DropdownMenuItem onClick={() => handleJustificativaActionClick(matricula, 'remanejamento')}>
                                    <ListRestart className="mr-2 h-4 w-4" />
                                    Solicitar remanejamento
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    className="text-destructive"
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
      
      {/* Modal de Justificativa (Desistente, Remanejamento, Transferir) */}
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
      
      {/* Modal de Realocação (Apenas Realocar usa este modal agora) */}
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
    </AdminLayout>
  );
};

export default Matriculas;