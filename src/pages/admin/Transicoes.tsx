import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowRight, CheckCircle, ListOrdered, GraduationCap, Users, Save } from "lucide-react";
import { useState, useMemo } from "react";
import { useTransicoes } from "@/hooks/use-transicoes";
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
import TransicoesList from "@/components/transicoes/TransicoesList";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Transicoes = () => {
  const currentYear = new Date().getFullYear();
  
  // O hook agora usa o ano atual internamente
  const { 
    classificacao, 
    isLoading, 
    isExecuting, 
    executeTransition, 
    updatePlanning, 
    savePlanning, 
    isSaving 
  } = useTransicoes();

  const targetYear = currentYear; // Usamos o ano atual como referência
  const cutoffDate = format(new Date(targetYear, 2, 31), 'dd/MM/yyyy'); // Mês 2 é Março

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
                <TransicoesList
                    title="Matriculados Atuais"
                    icon={GraduationCap}
                    data={matriculados}
                    updatePlanning={updatePlanning}
                    isSaving={isSaving}
                    isExecuting={isExecuting}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
                <TransicoesList
                    title="Fila de Espera / Convocados"
                    icon={ListOrdered}
                    data={fila}
                    updatePlanning={updatePlanning}
                    isSaving={isSaving}
                    isExecuting={isExecuting}
                />
            </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Concluintes (Evasão) - Lista separada */}
        <div className="pt-6">
            <TransicoesList
                title="Concluintes (Evasão Sugerida)"
                icon={Users}
                data={concluintes}
                updatePlanning={updatePlanning}
                isSaving={isSaving}
                isExecuting={isExecuting}
            />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Transicoes;