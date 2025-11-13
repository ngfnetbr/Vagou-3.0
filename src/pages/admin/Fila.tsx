import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Bell, XCircle, Eye, Clock, RotateCcw, History, ListRestart, CheckCircle, FileText } from "lucide-react";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crianca } from "@/lib/mock-data";
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

// Componentes Modulares
import { FilaStats } from "@/components/fila/FilaStats";
import { FilaFilters } from "@/components/fila/FilaFilters";
import { FilaTable } from "@/components/fila/FilaTable";
import { HistoricoAccordion } from "@/components/fila/HistoricoAccordion";


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
  
  // Modais State
  const [isConvocarModalOpen, setIsConvocarModalOpen] = useState(false);
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [criancaToConvoke, setCriancaToConvoke] = useState<Crianca | undefined>(undefined);
  const [criancaToJustify, setCriancaToJustify] = useState<Crianca | undefined>(undefined);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);


  // --- Helper Functions (kept here as they rely on data/state) ---

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

  // --- Data Processing ---

  const allCmeiNames = useMemo(() => Array.from(new Set(criancas.map(c => c.cmei1))).filter(Boolean), [criancas]);

  const { filteredFila, historicoCriancas, stats } = useMemo(() => {
    if (!criancas) return { filteredFila: [], historicoCriancas: [], stats: { totalFila: 0, comPrioridade: 0, convocados: 0 } };

    let filtered = criancas.filter(c => c.status === "Fila de Espera" || c.status === "Convocado");

    if (cmeiFilter !== "todos") {
      filtered = filtered.filter(c => c.cmei1 === cmeiFilter);
    }

    if (prioridadeFilter === "prioridade") {
      filtered = filtered.filter(c => c.programasSociais === "sim");
    } else if (prioridadeFilter === "normal") {
      filtered = filtered.filter(c => c.programasSociais === "nao");
    }
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(lowerCaseSearch) ||
        c.responsavel.toLowerCase().includes(lowerCaseSearch)
      );
    }

    const filaDeEspera = filtered.filter(c => c.status === "Fila de Espera");
    const convocados = filtered.filter(c => c.status === "Convocado");

    filaDeEspera.sort((a, b) => {
        if (a.programasSociais === 'sim' && b.programasSociais === 'nao') return -1;
        if (a.programasSociais === 'nao' && b.programasSociais === 'sim') return 1;
        return new Date(a.dataNascimento).getTime() - new Date(b.dataNascimento).getTime();
    });

    const sortedFila = filaDeEspera.map((c, index) => ({
        ...c,
        posicaoFila: index + 1,
    }));
    
    convocados.sort((a, b) => {
        if (!a.convocacaoDeadline) return 1;
        if (!b.convocacaoDeadline) return -1;
        return new Date(a.convocacaoDeadline).getTime() - new Date(b.convocacaoDeadline).getTime();
    });

    const totalFila = criancas.filter(c => c.status === "Fila de Espera").length;
    const comPrioridade = criancas.filter(c => c.status === "Fila de Espera" && c.programasSociais === "sim").length;
    const totalConvocados = criancas.filter(c => c.status === "Convocado").length;
    
    const historico = criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada" || c.status === "Desistente" || c.status === "Recusada");

    return { 
        filteredFila: [...convocados, ...sortedFila], 
        historicoCriancas: historico,
        stats: { totalFila, comPrioridade, convocados: totalConvocados }
    };

  }, [criancas, cmeiFilter, prioridadeFilter, searchTerm]);

  // --- Handlers ---

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

        <FilaStats {...stats} />

        <FilaFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            cmeiFilter={cmeiFilter}
            setCmeiFilter={setCmeiFilter}
            prioridadeFilter={prioridadeFilter}
            setPrioridadeFilter={setPrioridadeFilter}
            allCmeiNames={allCmeiNames}
        />

        <FilaTable
            filteredFila={filteredFila}
            isConfirmingMatricula={isConfirmingMatricula}
            handleConfirmarMatricula={handleConfirmarMatricula}
            handleConvocarClick={handleConvocarClick}
            handleJustificativaAction={handleJustificativaAction}
            getPriorityLabel={getPriorityLabel}
            getInscriptionDate={getInscriptionDate}
        />
        
        <HistoricoAccordion
            historicoCriancas={historicoCriancas}
            isReactivating={isReactivating}
            handleReativar={handleReativar}
            getStatusBadge={getStatusBadge}
            getFinalizationDate={getFinalizationDate}
        />
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