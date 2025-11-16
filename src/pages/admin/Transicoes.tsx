import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowRight, CheckCircle, Save, RotateCcw, Trash2, Users, ListOrdered, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useTransicoes, CriancaClassificada } from "@/hooks/use-transicoes";
import { format } from "date-fns";
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
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import RealocacaoMassaModal from "@/components/transicoes/RealocacaoMassaModal";
import StatusMassaModal from "@/components/transicoes/StatusMassaModal";
import RealocacaoModal from "@/components/RealocacaoModal";
import JustificativaModal from "@/components/JustificativaModal";
import { useCriancas } from "@/hooks/use-criancas";
import { ConvocationData, Crianca } from "@/integrations/supabase/types";
import { CmeiTransitionGroup } from "@/components/transicoes/CmeiTransitionGroup";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useNavigate } from "react-router-dom"; // Importando useNavigate

type JustificativaAction = 'desistente' | 'concluinte';

// Estrutura de agrupamento: CMEI -> Turma -> Lista de Crianças
interface GroupedData {
    [cmeiName: string]: {
        [turmaName: string]: CriancaClassificada[];
    };
}

const Transicoes = () => {
  const navigate = useNavigate();
  const { 
    classificacao, 
    isLoading, 
    isExecuting, 
    executeTransition, 
    savePlanning, 
    isSaving,
    updateCriancaStatusInPlanning,
    updateCriancaVagaInPlanning,
    massUpdateStatusInPlanning,
    massUpdateVagaInPlanning,
    initialClassification, 
    hasUnsavedChanges,
  } = useTransicoes();
  
  // O hook useCriancas é mantido para as mutações individuais que DEVEM ser imediatas (Realocação)
  const { 
    realocarCrianca, // Mantido para o isRealocating, mas não usado para a mutação aqui
    isRealocating, 
    isMarkingDesistente, 
    isTransferring 
  } = useCriancas(); 

  // --- Estados de Ação em Massa ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRealocacaoMassaModalOpen, setIsRealocacaoMassaModalOpen] = useState(false);
  const [isStatusMassaModalOpen, setIsStatusMassaModalOpen] = useState(false);
  
  // --- Estados de Ação Individual ---
  const [isRealocacaoIndividualModalOpen, setIsRealocacaoIndividualModalOpen] = useState(false);
  const [isJustificativaIndividualModalOpen, setIsJustificativaIndividualModalOpen] = useState(false);
  const [criancaToAction, setCriancaToAction] = useState<CriancaClassificada | undefined>(undefined);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);
  
  // --- Estado do Accordion (CMEIs abertos) ---
  const [openCmeis, setOpenCmeis] = useState<string[]>([]);
  
  // --- Lógica de Alterações Não Salvas ---
  // hasUnsavedChanges agora é calculado no hook useTransicoes
  
  // Aplica o alerta de alterações não salvas
  const blockNavigation = useUnsavedChangesWarning(hasUnsavedChanges, "Você tem alterações no planejamento de transição que não foram salvas ou aplicadas. Deseja realmente sair?");

  // --- Handlers de Navegação Bloqueada ---
  
  const handleSaveAndNavigate = async (to: string) => {
      try {
          await savePlanning();
          navigate(to);
      } catch (e) {
          // Erro já tratado pelo savePlanning
      }
  };
  
  const handleDiscardAndNavigate = (to: string) => {
      // Limpa o planejamento do localStorage e navega
      localStorage.removeItem("vagou_transition_planning");
      navigate(to);
  };

  // --- Handlers de Seleção ---
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleClearSelection = () => {
      setSelectedIds([]);
  };
  
  // --- Data Processing ---
  
  // 1. Grouping by CMEI and then by Turma (AGORA USA OS CAMPOS PLANEJADOS)
  const groupedData: GroupedData = useMemo(() => {
    return classificacao.reduce((acc, crianca) => {
        
        const plannedStatus = crianca.planned_status || crianca.status;
        
        let cmeiName: string;
        let turmaName: string;

        // 1. Se o status planejado for de saída, agrupa em 'Saídas Planejadas'
        if (plannedStatus === 'Desistente' || plannedStatus === 'Recusada') {
            cmeiName = 'Saídas Planejadas';
            turmaName = 'Conclusão de Ciclo / Desistência';
        } 
        // 2. Se a criança está na fila, agrupa em 'Fila Geral'
        else if (plannedStatus === 'Fila de Espera' || crianca.status === 'Fila de Espera') {
            cmeiName = 'Fila Geral';
            turmaName = 'Fila de Espera';
        }
        // 3. Agrupamento normal (Matriculado/Convocado/Remanejamento)
        else {
            // Prioriza o nome planejado, senão usa o nome atual.
            cmeiName = crianca.planned_cmei_nome || crianca.cmeiNome || 'Fila Geral / Sem CMEI Atual'; 
            turmaName = crianca.planned_turma_nome || crianca.turmaNome || 'Sem Turma Definida'; 
        }
        
        if (!acc[cmeiName]) {
            acc[cmeiName] = {};
        }
        if (!acc[cmeiName][turmaName]) {
            acc[cmeiName][turmaName] = [];
        }
        acc[cmeiName][turmaName].push(crianca);
        return acc;
    }, {} as GroupedData);
  }, [classificacao]);
  
  // --- Handlers de Ação em Massa ---
  const handleMassAction = (action: 'realocar' | 'status') => {
      if (selectedIds.length === 0) {
          toast.warning("Selecione pelo menos uma criança para realizar a ação em massa.");
          return;
      }
      
      if (action === 'realocar') {
          setIsRealocacaoMassaModalOpen(true);
      } else if (action === 'status') {
          // Esta ação agora é dedicada a marcar como Concluinte/Saída
          setIsStatusMassaModalOpen(true);
      }
  };
  
  const handleMassModalClose = () => {
      setIsRealocacaoMassaModalOpen(false);
      setIsStatusMassaModalOpen(false);
      setSelectedIds([]);
  };
  
  // --- Handlers de Ação Individual ---
  
  // 1. Realocação (Mover para nova turma)
  const handleRealocacaoIndividualClick = (crianca: CriancaClassificada) => {
      setCriancaToAction(crianca);
      setIsRealocacaoIndividualModalOpen(true);
  };
  
  // Esta função AGORA ATUALIZA O ESTADO DE PLANEJAMENTO LOCAL
  const handleRealocacaoIndividualConfirm = async (criancaId: string, vagaString: string) => {
      // vagaString: "cmei_id|turma_id|cmei_nome|turma_nome"
      const parts = vagaString.split('|');
      if (parts.length !== 4) {
          toast.error("Erro de seleção", { description: "Formato de vaga inválido." });
          return;
      }
      const [cmei_id, turma_id, cmei_nome, turma_nome] = parts;
      
      // Atualiza o estado de planejamento local
      updateCriancaVagaInPlanning(criancaId, cmei_id, turma_id, cmei_nome, turma_nome);
      
      toast.success("Realocação planejada!", { description: `A criança será movida para ${cmei_nome} - ${turma_nome} ao aplicar a transição.` });
      
      // Abre o CMEI de destino no accordion
      setOpenCmeis(prev => {
          if (!prev.includes(cmei_nome)) {
              return [...prev, cmei_nome];
          }
          return prev;
      });
      
      // Fechar modal
      setIsRealocacaoIndividualModalOpen(false);
      setCriancaToAction(undefined);
  };
  
  // 2. Mudança de Status (Desistente/Concluinte)
  const handleStatusIndividualClick = (crianca: CriancaClassificada, action: JustificativaAction) => {
      setCriancaToAction(crianca);
      setCurrentJustificativaAction(action);
      setIsJustificativaIndividualModalOpen(true);
  };
  
  // Esta função agora atualiza o estado de planejamento, não o DB
  const handleJustificativaIndividualConfirm = async (justificativa: string) => {
      if (!criancaToAction || !currentJustificativaAction) return;
      
      const id = criancaToAction.id;
      let newStatus: Crianca['status'] = 'Desistente';
      let actionLabel = '';
      
      if (currentJustificativaAction === 'desistente') {
          newStatus = 'Desistente';
          actionLabel = 'Desistência planejada';
      } else if (currentJustificativaAction === 'concluinte') {
          // Usamos 'Desistente' como status de saída/concluinte no planejamento
          newStatus = 'Desistente'; 
          actionLabel = 'Conclusão/Evasão planejada';
      }
      
      updateCriancaStatusInPlanning(id, newStatus, justificativa);
      toast.success(actionLabel, { description: "A mudança será aplicada ao executar a transição." });
      
      // Abre o grupo de Saídas Planejadas no accordion
      setOpenCmeis(prev => {
          if (!prev.includes('Saídas Planejadas')) {
              return [...prev, 'Saídas Planejadas'];
          }
          return prev;
      });
      
      setIsJustificativaIndividualModalOpen(false);
      setCriancaToAction(undefined);
      setCurrentJustificativaAction(undefined);
  };
  
  const getJustificativaProps = (action: JustificativaAction) => {
    const criancaNome = criancaToAction?.nome || 'a criança';
    
    switch (action) {
      case 'desistente':
        return {
          title: `Marcar ${criancaNome} como Desistente`,
          description: "Confirme a desistência. A criança será marcada como 'Desistente' e removida da lista de matrículas ativas.",
          actionLabel: "Planejar Desistência",
          isPending: isMarkingDesistente, // Usamos o isPending do hook real apenas para feedback visual
          actionVariant: 'destructive' as const,
        };
      case 'concluinte':
        return {
          title: `Marcar ${criancaNome} como Conclusão de Ciclo`,
          description: "Confirme a conclusão do ciclo no CMEI. A matrícula será encerrada e a criança marcada como saída.",
          actionLabel: "Planejar Conclusão",
          isPending: isTransferring, // Usamos o isPending do hook real apenas para feedback visual
          actionVariant: 'secondary' as const,
        };
      default:
        return { title: "", description: "", actionLabel: "", isPending: false, actionVariant: 'destructive' as const };
    }
  };
  
  const handleExecuteTransition = async () => {
    await executeTransition();
  };
  
  if (isLoading) {
    return (
      <AdminLayout shouldBlockNavigation={hasUnsavedChanges}>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando dados para planejamento...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
        shouldBlockNavigation={hasUnsavedChanges}
        onSaveAndNavigate={handleSaveAndNavigate}
        onDiscardAndNavigate={handleDiscardAndNavigate}
        isSaving={isSaving}
    >
      <div className="space-y-6 min-h-full">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transição Anual de Turmas</h1>
            <p className="text-muted-foreground">Planejamento e execução do remanejamento de crianças para o próximo ciclo letivo.</p>
          </div>

          <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Modo Planejamento Ativo</AlertTitle>
              <AlertDescription>
                  Todas as ações de Realocação em Massa e Mudança de Status (Desistente/Concluinte) são salvas no planejamento e só serão aplicadas ao banco de dados quando você clicar em 
                  <span className="font-semibold"> "Aplicar Transição"</span>. O planejamento é persistido automaticamente no seu navegador.
              </AlertDescription>
          </Alert>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                Ações de Transição
              </CardTitle>
              <CardDescription>
                Revise as crianças ativas e utilize as ações em massa para realocar ou mudar status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex gap-4 pt-4 border-t border-border">
                  
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button 
                              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                              disabled={isExecuting || isLoading || classificacao.length === 0}
                          >
                              {isExecuting ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              {isExecuting ? "Aplicando..." : `Aplicar Transição`}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Aplicação da Transição?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Esta ação irá aplicar o planejamento atual, alterando o status de {classificacao.length} crianças no banco de dados. 
                                  <span className="font-semibold text-destructive block mt-2">Esta ação é irreversível e irá atualizar as turmas e a fila de espera.</span>
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel disabled={isExecuting}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                  onClick={handleExecuteTransition} 
                                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                  disabled={isExecuting}
                              >
                                  {isExecuting ? "Aplicando..." : "Confirmar e Aplicar"}
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
            </CardContent>
          </Card>
          
          {/* Ações em Massa */}
          {selectedIds.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4 flex items-center justify-between">
                      <p className="font-semibold text-primary">{selectedIds.length} crianças selecionadas.</p>
                      <div className="flex gap-3">
                          <Button 
                              variant="outline" 
                              className="text-muted-foreground border-border hover:bg-muted"
                              onClick={handleClearSelection}
                              disabled={isExecuting}
                          >
                              <XCircle className="mr-2 h-4 w-4" />
                              Desfazer Seleção
                          </Button>
                          <Button 
                              variant="outline" 
                              className="text-secondary border-secondary hover:bg-secondary/10"
                              onClick={() => handleMassAction('realocar')}
                              disabled={isExecuting}
                          >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Realocar em Massa
                          </Button>
                          <Button 
                              variant="outline" 
                              className="text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleMassAction('status')}
                              disabled={isExecuting}
                          >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Conclusão em Massa
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          )}
          
          {/* LAYOUT VERTICAL AGRUPADO COM ACCORDION */}
          <h2 className="text-2xl font-bold text-foreground pt-4">Planejamento Detalhado por CMEI</h2>
          <CardDescription className="mb-4">
              Revise e ajuste a ação sugerida para cada criança.
          </CardDescription>

          <Accordion 
              type="multiple" 
              className="w-full space-y-4"
              value={openCmeis}
              onValueChange={setOpenCmeis}
          >
              {Object.entries(groupedData).map(([cmeiName, turmaGroups], index) => (
                  <AccordionItem key={cmeiName} value={cmeiName} className="border rounded-lg overflow-hidden bg-card">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center gap-3">
                              {cmeiName === 'Fila Geral' ? (
                                  <ListOrdered className="h-6 w-6 text-accent" />
                              ) : cmeiName === 'Saídas Planejadas' ? (
                                  <Trash2 className="h-6 w-6 text-destructive" />
                              ) : (
                                  <Users className="h-6 w-6 text-primary" />
                              )}
                              <span className="text-xl font-bold">{cmeiName}</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                          <CmeiTransitionGroup
                              cmeiName={cmeiName}
                              turmaGroups={turmaGroups}
                              isExecuting={isExecuting}
                              selectedIds={selectedIds}
                              toggleSelection={toggleSelection}
                              handleRealocacaoIndividualClick={handleRealocacaoIndividualClick}
                              handleStatusIndividualClick={handleStatusIndividualClick}
                          />
                      </AccordionContent>
                  </AccordionItem>
              ))}
          </Accordion>
          
        </div>
        
        {/* Modais de Ação em Massa */}
        <Dialog open={isRealocacaoMassaModalOpen} onOpenChange={setIsRealocacaoMassaModalOpen}>
          <RealocacaoMassaModal 
              selectedIds={selectedIds}
              onClose={handleMassModalClose}
              onConfirmMassRealocate={massUpdateVagaInPlanning} // Passa a função de planejamento
          />
        </Dialog>
        
        <Dialog open={isStatusMassaModalOpen} onOpenChange={setIsStatusMassaModalOpen}>
          <StatusMassaModal 
              selectedIds={selectedIds}
              onClose={handleMassModalClose}
              onConfirmMassStatusUpdate={massUpdateStatusInPlanning} // Passa a função de planejamento
              // Adicionando prop para restringir a ação apenas a 'Concluinte'
              allowedStatus={['Desistente']} // Usamos 'Desistente' como status de saída/concluinte no planejamento
              actionTitle="Conclusão em Massa"
              actionDescription="Confirme a conclusão do ciclo para as crianças selecionadas."
          />
        </Dialog>
        
        {/* Modal de Realocação Individual */}
        <Dialog open={isRealocacaoIndividualModalOpen} onOpenChange={setIsRealocacaoIndividualModalOpen}>
          {criancaToAction && (
            <RealocacaoModal
              crianca={criancaToAction}
              // Passa a função de planejamento local
              onConfirm={handleRealocacaoIndividualConfirm} 
              onClose={() => setIsRealocacaoIndividualModalOpen(false)}
              isPending={isRealocating} // Usa o isPending da mutação real
            />
          )}
        </Dialog>
        
        {/* Modal de Justificativa Individual (Status) */}
        <Dialog open={isJustificativaIndividualModalOpen} onOpenChange={setIsJustificativaIndividualModalOpen}>
          {criancaToAction && currentJustificativaAction && (
            <JustificativaModal
              {...getJustificativaProps(currentJustificativaAction)}
              onConfirm={handleJustificativaIndividualConfirm}
              onClose={() => {
                setIsJustificativaIndividualModalOpen(false);
                setCriancaToAction(undefined);
                setCurrentJustificativaAction(undefined);
              }}
            />
          )}
        </Dialog>
      </AdminLayout>
    );
  };

export default Transicoes;
</dyad-file>

### 6. Atualizar `src/components/transicoes/CmeiTransitionGroup.tsx`

Removendo a prop `isSaving` que não é mais usada.

<dyad-write path="src/components/transicoes/CmeiTransitionGroup.tsx" description="Removendo a prop isSaving do CmeiTransitionGroup.">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, RotateCcw, Trash2, ArrowRight, CheckCircle, Users, ListOrdered, CheckSquare } from "lucide-react";
import { CriancaClassificada, StatusTransicao } from "@/hooks/use-transicoes";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type JustificativaAction = 'desistente' | 'concluinte';

interface CmeiTransitionGroupProps {
    cmeiName: string;
    turmaGroups: { [turmaName: string]: CriancaClassificada[] }; // Novo prop
    isExecuting: boolean;
    selectedIds: string[];
    toggleSelection: (id: string) => void;
    handleRealocacaoIndividualClick: (crianca: CriancaClassificada) => void;
    handleStatusIndividualClick: (crianca: CriancaClassificada, action: JustificativaAction) => void;
}

const getStatusBadge = (status: CriancaClassificada['status']) => {
    const variants: Record<CriancaClassificada['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary/20 text-secondary", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary/20 text-secondary", text: "Matriculado" },
      "Fila de Espera": { className: "bg-accent/20 text-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
      "Remanejamento Solicitado": { className: "bg-accent/20 text-foreground", text: "Remanejamento Solicitado" },
    };
    
    const config = variants[status] || { className: "bg-muted text-muted-foreground", text: status };
    return <Badge className={cn("w-fit", config.className)}>{config.text}</Badge>;
};

export const CmeiTransitionGroup = ({
    cmeiName,
    turmaGroups,
    isExecuting,
    selectedIds,
    toggleSelection,
    handleRealocacaoIndividualClick,
    handleStatusIndividualClick,
}: CmeiTransitionGroupProps) => {
    const navigate = useNavigate();
    
    // Função para selecionar/desselecionar todas as crianças de uma turma
    const toggleSelectAllTurma = (criancasList: CriancaClassificada[]) => {
        const turmaIds = criancasList.map(c => c.id);
        const allSelected = turmaIds.every(id => selectedIds.includes(id));
        
        if (allSelected) {
            // Se todos estão selecionados, desmarca um por um
            turmaIds.forEach(id => {
                if (selectedIds.includes(id)) {
                    toggleSelection(id);
                }
            });
            
        } else {
            // Selecionar todos
            turmaIds.forEach(id => {
                if (!selectedIds.includes(id)) {
                    toggleSelection(id);
                }
            });
        }
    };
    
    // Função para obter o nome da vaga planejada (se houver mudança)
    const getPlannedVaga = (crianca: CriancaClassificada) => {
        // Se houver planejamento de vaga
        if (crianca.planned_cmei_nome && crianca.planned_turma_nome) {
            return (
                <Badge variant="secondary" className="bg-primary/10 text-primary font-normal">
                    {crianca.planned_cmei_nome} - {crianca.planned_turma_nome}
                </Badge>
            );
        }
        
        return null;
    };
    
    // Função para obter o status planejado (se houver mudança)
    const getPlannedStatus = (crianca: CriancaClassificada) => {
        // Se houver um status planejado, exibe-o
        if (crianca.planned_status) {
            // Se for uma realocação de Saída Final, o status planejado é Convocado
            if (crianca.planned_status === 'Convocado') {
                return getStatusBadge('Convocado');
            }
            
            // Caso contrário, exibe o status de saída planejado (Desistente/Recusada)
            return getStatusBadge(crianca.planned_status);
        }
        
        // Se não houver status planejado, exibe "Não Planejado"
        return (
            <span className="text-xs text-muted-foreground italic">
                Não Planejado
            </span>
        );
    };

    return (
        <Accordion type="multiple" className="w-full space-y-2 p-4">
            {Object.entries(turmaGroups).map(([turmaName, criancasList]) => {
                
                const turmaIds = criancasList.map(c => c.id);
                const allSelected = turmaIds.length > 0 && turmaIds.every(id => selectedIds.includes(id));
                const someSelected = turmaIds.some(id => selectedIds.includes(id)) && !allSelected;
                
                return (
                <AccordionItem key={turmaName} value={turmaName} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                                <ListOrdered className="h-5 w-5 text-secondary" />
                                <span className="font-semibold text-base">{turmaName}</span>
                                <Badge variant="outline" className="ml-2">{criancasList.length} crianças</Badge>
                            </div>
                            
                            {/* Botão Selecionar Todos por Turma */}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                    e.stopPropagation(); // Previne que o accordion feche
                                    toggleSelectAllTurma(criancasList);
                                }}
                                disabled={isExecuting || criancasList.length === 0}
                                className={cn(
                                    "text-xs h-7",
                                    allSelected && "bg-primary/10 text-primary border-primary/50",
                                    someSelected && "bg-primary/5 text-primary border-primary/30"
                                )}
                            >
                                <CheckSquare className="mr-2 h-3 w-3" />
                                {allSelected ? "Desmarcar Todos" : "Selecionar Todos"}
                            </Button>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-12">Sel.</TableHead>
                                    <TableHead>Criança</TableHead>
                                    <TableHead>Status Atual</TableHead>
                                    <TableHead>Status Planejado</TableHead>
                                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {criancasList.map(c => {
                                    const isSelected = selectedIds.includes(c.id);
                                    // A criança tem uma mudança planejada se planned_status for definido OU se a vaga planejada for diferente da atual
                                    const hasPlannedChange = !!c.planned_status || !!c.planned_cmei_id || !!c.planned_turma_id;
                                    
                                    // Determina se as ações de Realocação e Conclusão devem ser exibidas
                                    // Realocação: Permitida para Remanejamento Interno E Fila Reclassificada
                                    const showRealocacao = c.statusTransicao === 'Remanejamento Interno' || c.statusTransicao === 'Fila Reclassificada';
                                    
                                    // Conclusão/Desistência: Permitida para Remanejamento Interno
                                    const showConclusao = c.statusTransicao === 'Remanejamento Interno';
                                    
                                    return (
                                    <TableRow key={c.id} className={cn(hasPlannedChange && "bg-yellow-50/50 hover:bg-yellow-50/70", isSelected && "bg-primary/10 hover:bg-primary/15")}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelection(c.id)}
                                                disabled={isExecuting}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{c.nome}</div>
                                            <div className="text-xs text-muted-foreground">{c.idade}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 items-start">
                                                {getStatusBadge(c.status)}
                                                {(c.cmeiNome || c.turmaNome) && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {c.cmeiNome} - {c.turmaNome}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 items-start">
                                                {getPlannedStatus(c)}
                                                {getPlannedVaga(c)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => navigate(`/admin/criancas/${c.id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver Detalhes
                                                    </DropdownMenuItem>
                                                    
                                                    {/* Ação de Realocação */}
                                                    {showRealocacao && (
                                                        <DropdownMenuItem 
                                                            onClick={() => handleRealocacaoIndividualClick(c)}
                                                        >
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Realocar Vaga
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    {/* Marcar Conclusão de Ciclo */}
                                                    {showConclusao && (
                                                        <DropdownMenuItem 
                                                            onClick={() => handleStatusIndividualClick(c, 'concluinte')}
                                                            className="text-secondary focus:bg-secondary/10 focus:text-secondary"
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Marcar Conclusão de Ciclo
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    {/* Marcar Desistente */}
                                                    {showConclusao && (
                                                        <DropdownMenuItem 
                                                            onClick={() => handleStatusIndividualClick(c, 'desistente')}
                                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Marcar Desistente
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            );
            })}
        </Accordion>
    );
};