import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowRight, CheckCircle, Save, RotateCcw, Trash2, Users } from "lucide-react";
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
import { ConvocationData } from "@/integrations/supabase/types";
import { CmeiTransitionGroup } from "@/components/transicoes/CmeiTransitionGroup";

type JustificativaAction = 'desistente' | 'concluinte';

// Estrutura de agrupamento: CMEI -> Turma -> Lista de Crianças
interface GroupedData {
    [cmeiName: string]: {
        [turmaName: string]: CriancaClassificada[];
    };
}

const Transicoes = () => {
  const currentYear = new Date().getFullYear();
  
  const { 
    classificacao, 
    isLoading, 
    isExecuting, 
    executeTransition, 
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
  
  // --- Data Processing ---
  
  // 1. Grouping by CMEI and then by Turma
  const groupedData: GroupedData = useMemo(() => {
    return classificacao.reduce((acc, crianca) => {
        // Se a criança não tem CMEI atual, ela está na fila geral.
        const cmeiName = crianca.cmeiNome || 'Fila Geral / Sem CMEI Atual'; 
        // Se a criança não tem Turma atual, ela está na fila de espera (dentro do CMEI ou Geral)
        const turmaName = crianca.turmaNome || 'Fila de Espera'; 
        
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
      setIsRealocacaoIndividualModalOpen(false);
      setCriancaToAction(undefined);
  };
  
  // 2. Mudança de Status (Desistente/Concluinte)
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
          } else if (currentJustificativaAction === 'concluinte') {
              await transferirCrianca({ id, justificativa: `Concluinte (Evasão). ${justificativa}` });
          }
          
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
      case 'concluinte':
        return {
          title: `Marcar ${criancaNome} como Concluinte (Evasão)`,
          description: "Confirme a conclusão do ciclo no CMEI. A matrícula será encerrada e a criança marcada como desistente/transferida.",
          actionLabel: "Confirmar Conclusão",
          isPending: isTransferring,
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
          <h1 className="text-3xl font-bold text-foreground">Transição Anual de Turmas</h1>
          <p className="text-muted-foreground">Planejamento e execução do remanejamento de crianças para o próximo ciclo letivo.</p>
        </div>

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
                            {isExecuting ? "Aplicando..." : `Aplicar Transição`}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Aplicação da Transição?</AlertDialogTitle>
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
        
        {/* LAYOUT VERTICAL AGRUPADO */}
        <h2 className="text-2xl font-bold text-foreground pt-4">Planejamento Detalhado por CMEI</h2>
        <CardDescription className="mb-4">
            Revise e ajuste a ação sugerida para cada criança.
        </CardDescription>

        <div className="space-y-6"> 
            {Object.entries(groupedData).map(([cmeiName, turmaGroups]) => (
                <div key={cmeiName} className="w-full">
                    <CmeiTransitionGroup
                        cmeiName={cmeiName}
                        turmaGroups={turmaGroups}
                        isSaving={isSaving}
                        isExecuting={isExecuting}
                        selectedIds={selectedIds}
                        toggleSelection={toggleSelection}
                        handleRealocacaoIndividualClick={handleRealocacaoIndividualClick}
                        handleStatusIndividualClick={handleStatusIndividualClick}
                    />
                </div>
            ))}
        </div>
        
      </div>
      
      {/* Modais de Ação em Massa */}
      <Dialog open={isRealocacaoMassaModalOpen} onOpenChange={setIsRealocacaoMassaModalOpen}>
        <RealocacaoMassaModal 
            selectedIds={selectedIds}
            onClose={handleMassModalClose}
        />
      </Dialog>
      
      <Dialog open={isStatusMassaModalOpen} onOpenChange={setIsStatusMassaModalOpen}>
        <StatusMassaModal 
            selectedIds={selectedIds}
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