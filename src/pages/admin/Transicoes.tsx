import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowRight, CheckCircle, ListOrdered, GraduationCap, Users, Save, RotateCcw, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useTransicoes, CriancaClassificada, StatusTransicao } from "@/hooks/use-transicoes";
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
import { RemanejamentoTable } from "@/components/transicoes/RemanejamentoTable";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import RealocacaoMassaModal from "@/components/transicoes/RealocacaoMassaModal";
import StatusMassaModal from "@/components/transicoes/StatusMassaModal";
import RealocacaoModal from "@/components/RealocacaoModal"; // Modal de Realocação Individual
import JustificativaModal from "@/components/JustificativaModal"; // Modal de Status Individual
import { useCriancas } from "@/hooks/use-criancas";
import { ConvocationData } from "@/integrations/supabase/types";

type JustificativaAction = 'desistente' | 'transferir'; // Ações de status que exigem justificativa

const Transicoes = () => {
  const currentYear = new Date().getFullYear();
  
  const { 
    classificacao, 
    isLoading, 
    isExecuting, 
    executeTransition, 
    updatePlanning, 
    savePlanning, 
    isSaving 
  } = useTransicoes();
  
  const { 
    realocarCrianca, 
    isRealocating, 
    marcarDesistente, 
    isMarkingDesistente,
    transferirCrianca,
    isTransferring,
  } = useCriancas();

  const targetYear = currentYear;
  const cutoffDate = format(new Date(targetYear, 2, 31), 'dd/MM/yyyy');
  
  // --- Estados de Ação em Massa ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRealocacaoMassaModalOpen, setIsRealocacaoMassaModalOpen] = useState(false);
  const [isStatusMassaModalOpen, setIsStatusMassaModalOpen] = useState(false);
  
  // --- Estados de Ação Individual ---
  const [isRealocacaoIndividualModalOpen, setIsRealocacaoIndividualModalOpen] = useState(false);
  const [isJustificativaIndividualModalOpen, setIsJustificativaIndividualModalOpen] = useState(false);
  const [criancaToAction, setCriancaToAction] = useState<CriancaClassificada | undefined>(undefined);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);

  // --- Handlers de Seleção ---
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const toggleAllSelection = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
        setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };
  
  // --- Handlers de Ação em Massa (Mock) ---
  const handleMassAction = (action: 'realocar' | 'status') => {
      if (selectedIds.length === 0) {
          toast.warning("Selecione pelo menos uma criança para realizar a ação em massa.");
          return;
      }
      
      if (action === 'realocar') {
          setIsRealocacaoMassaModalOpen(true);
      } else if (action === 'status') {
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
  
  const handleRealocacaoIndividualConfirm = async (criancaId: string, data: ConvocationData) => {
      await realocarCrianca({ id: criancaId, data });
      // Após a realocação, o planejamento deve ser atualizado (re-fetch)
      // O hook useCriancas já invalida a query principal, o useTransicoes irá recarregar.
      setIsRealocacaoIndividualModalOpen(false);
      setCriancaToAction(undefined);
  };
  
  // 2. Mudança de Status (Desistente/Transferir)
  const handleStatusIndividualClick = (crianca: CriancaClassificada, action: JustificativaAction) => {
      setCriancaToAction(crianca);
      setCurrentJustificativaAction(action);
      setIsJustificativaIndividualModalOpen(true);
  };
  
  const handleJustificativaIndividualConfirm = async (justificativa: string) => {
      if (!criancaToAction || !currentJustificativaAction) return;
      
      const id = criancaToAction.id;
      
      try {
          if (currentJustificativaAction === 'desistente') {
              await marcarDesistente({ id, justificativa });
          } else if (currentJustificativaAction === 'transferir') {
              await transferirCrianca({ id, justificativa });
          }
          
          // Após a mudança de status, o planejamento deve ser atualizado (re-fetch)
          setIsJustificativaIndividualModalOpen(false);
          setCriancaToAction(undefined);
          setCurrentJustificativaAction(undefined);
      } catch (e) {
          // Erro tratado pelo hook
      }
  };
  
  const getJustificativaProps = (action: JustificativaAction) => {
    const criancaNome = criancaToAction?.nome || 'a criança';
    
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
  
  // --- Data Processing ---
  const { matriculados, fila, concluintes } = useMemo(() => {
    const matriculados = classificacao.filter(c => c.status === 'Matriculado' || c.status === 'Matriculada' || c.status === 'Remanejamento Solicitado');
    const fila = classificacao.filter(c => c.status === 'Fila de Espera' || c.status === 'Convocado');
    const concluintes = classificacao.filter(c => c.statusTransicao === 'Concluinte');
    
    return { matriculados, fila, concluintes };
  }, [classificacao]);
  
  const handleExecuteTransition = async () => {
    await executeTransition();
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando dados para planejamento...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planejamento de Remanejamento</h1>
          <p className="text-muted-foreground">Revise a classificação etária e planeje a movimentação de crianças para o próximo ciclo.</p>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Status do Planejamento
            </CardTitle>
            <CardDescription>
              A classificação etária é baseada na idade da criança em 31 de Março de {currentYear}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <Alert className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Data de Corte</AlertTitle>
                <AlertDescription>
                    A classificação etária para remanejamento é calculada com base na idade da criança em 
                    <span className="font-semibold"> {cutoffDate} </span>.
                </AlertDescription>
            </Alert>
            
            <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-2">Resumo do Planejamento ({classificacao.length} crianças ativas)</h3>
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-secondary/10 border-secondary">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-secondary" />
                                <p className="text-xl font-bold text-secondary">{matriculados.length}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Remanejamento Interno</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-accent/10 border-accent">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <ListOrdered className="h-5 w-5 text-foreground" />
                                <p className="text-xl font-bold text-foreground">{fila.length}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Fila Reclassificada</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-destructive/10 border-destructive">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-destructive" />
                                <p className="text-xl font-bold text-destructive">{concluintes.length}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Concluintes (Evasão)</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-border">
                <Button 
                    variant="outline"
                    className="flex-1 text-primary border-primary hover:bg-primary/10"
                    onClick={savePlanning}
                    disabled={isSaving || isExecuting || isLoading || classificacao.length === 0}
                >
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? "Salvando..." : "Salvar Planejamento"}
                </Button>
                
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
                            {isExecuting ? "Aplicando..." : `Aplicar Remanejamento`}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Aplicação do Remanejamento?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação irá aplicar o planejamento atual, alterando o status de {classificacao.length} crianças. 
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
                            className="text-secondary border-secondary hover:bg-secondary/10"
                            onClick={() => handleMassAction('realocar')}
                            disabled={isExecuting || isSaving}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Realocar em Massa
                        </Button>
                        <Button 
                            variant="outline" 
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleMassAction('status')}
                            disabled={isExecuting || isSaving}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Mudar Status em Massa
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}
        
        {/* Layout de Planejamento (Duas Colunas) */}
        <h2 className="text-2xl font-bold text-foreground pt-4">Planejamento Detalhado</h2>
        <CardDescription className="mb-4">
            Revise e ajuste a ação sugerida para cada criança.
        </CardDescription>

        <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[75vh] rounded-lg border"
        >
            <ResizablePanel defaultSize={50} minSize={30}>
                <RemanejamentoTable
                    title="Matriculados Atuais"
                    icon={GraduationCap}
                    data={matriculados}
                    updatePlanning={updatePlanning}
                    isSaving={isSaving}
                    isExecuting={isExecuting}
                    selectedIds={selectedIds}
                    toggleSelection={toggleSelection}
                    toggleAllSelection={(ids) => toggleAllSelection(ids.filter(id => matriculados.map(m => m.id).includes(id)))}
                    handleRealocacaoIndividualClick={handleRealocacaoIndividualClick}
                    handleStatusIndividualClick={handleStatusIndividualClick}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
                <RemanejamentoTable
                    title="Fila de Espera / Convocados"
                    icon={ListOrdered}
                    data={fila}
                    updatePlanning={updatePlanning}
                    isSaving={isSaving}
                    isExecuting={isExecuting}
                    selectedIds={selectedIds}
                    toggleSelection={toggleSelection}
                    toggleAllSelection={(ids) => toggleAllSelection(ids.filter(id => fila.map(f => f.id).includes(id)))}
                    handleRealocacaoIndividualClick={handleRealocacaoIndividualClick}
                    handleStatusIndividualClick={handleStatusIndividualClick}
                />
            </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Concluintes (Evasão) - Lista separada */}
        <div className="pt-6">
            <RemanejamentoTable
                title="Concluintes (Evasão Sugerida)"
                icon={Users}
                data={concluintes}
                updatePlanning={updatePlanning}
                isSaving={isSaving}
                isExecuting={isExecuting}
                selectedIds={selectedIds}
                toggleSelection={toggleSelection}
                toggleAllSelection={(ids) => toggleAllSelection(ids.filter(id => concluintes.map(c => c.id).includes(id)))}
                handleRealocacaoIndividualClick={handleRealocacaoIndividualClick}
                handleStatusIndividualClick={handleStatusIndividualClick}
            />
        </div>
      </div>
      
      {/* Modais de Ação em Massa */}
      <Dialog open={isRealocacaoMassaModalOpen} onOpenChange={setIsRealocacaoMassaModalOpen}>
        <RealocacaoMassaModal 
            selectedCount={selectedIds.length}
            onClose={handleMassModalClose}
        />
      </Dialog>
      
      <Dialog open={isStatusMassaModalOpen} onOpenChange={setIsStatusMassaModalOpen}>
        <StatusMassaModal 
            selectedCount={selectedIds.length}
            onClose={handleMassModalClose}
        />
      </Dialog>
      
      {/* Modal de Realocação Individual */}
      <Dialog open={isRealocacaoIndividualModalOpen} onOpenChange={setIsRealocacaoIndividualModalOpen}>
        {criancaToAction && (
          <RealocacaoModal
            crianca={criancaToAction}
            onConfirm={handleRealocacaoIndividualConfirm}
            onClose={() => setIsRealocacaoIndividualModalOpen(false)}
            isPending={isRealocating}
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