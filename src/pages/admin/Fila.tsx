import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2 } from "lucide-react";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crianca } from "@/integrations/supabase/types"; // Importação atualizada
import { Dialog } from "@/components/ui/dialog";
import ConvocarModal from "@/components/ConvocarModal";
import JustificativaModal from "@/components/JustificativaModal";

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
  const [criancaToConvoke, setCriancaToConvoke] = useState<Crianca | undefined>(undefined);
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false); // Estado Faltante
  const [criancaToJustify, setCriancaToJustify] = useState<Crianca | undefined>(undefined);
  const [currentJustificativaAction, setCurrentJustificativaAction] = useState<JustificativaAction | undefined>(undefined);


  // --- Helper Functions (kept here as they rely on data/state) ---

  const getPriorityLabel = (crianca: Crianca) => {
    if (crianca.programas_sociais) {
      return "Prioridade Social";
    }
    if (crianca.cmei2_preferencia) return "Múltipla Opção";
    return "Normal";
  };

  const getInscriptionDate = (crianca: Crianca) => {
    // No Supabase, a data de inscrição inicial é a created_at, mas vamos usar a data do primeiro histórico se disponível
    // Por enquanto, usamos created_at como fallback
    try {
        return format(parseISO(crianca.created_at), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
        return 'N/A';
    }
  };
  
  const getFinalizationDate = (crianca: Crianca) => {
    // No Supabase, usamos created_at como fallback para a data final
    try {
        return format(parseISO(crianca.created_at), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
        return 'N/A';
    }
  };
  
  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary text-secondary-foreground", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary text-secondary-foreground", text: "Matriculado" },
      "Fila de Espera": { className: "bg-accent/20 text-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
      "Remanejamento Solicitado": { className: "bg-accent/20 text-foreground", text: "Remanejamento Solicitado" },
    };
    
    const config = variants[status] || { className: "bg-muted text-muted-foreground", text: status };
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  // --- Data Processing ---

  const allCmeiNames = useMemo(() => Array.from(new Set(criancas.map(c => c.cmei1_preferencia))).filter(Boolean), [criancas]);

  const { filteredFila, historicoCriancas, stats } = useMemo(() => {
    if (!criancas) return { filteredFila: [], historicoCriancas: [], stats: { totalFila: 0, comPrioridade: 0, convocados: 0 } };

    let filtered = criancas.filter(c => c.status === "Fila de Espera" || c.status === "Convocado");

    if (cmeiFilter !== "todos") {
      filtered = filtered.filter(c => c.cmei1_preferencia === cmeiFilter);
    }

    if (prioridadeFilter === "prioridade") {
      filtered = filtered.filter(c => c.programas_sociais);
    } else if (prioridadeFilter === "normal") {
      filtered = filtered.filter(c => !c.programas_sociais);
    }
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(lowerCaseSearch) ||
        c.responsavel_nome.toLowerCase().includes(lowerCaseSearch)
      );
    }

    const filaDeEspera = filtered.filter(c => c.status === "Fila de Espera");
    const convocados = filtered.filter(c => c.status === "Convocado");

    // Ordenação da Fila de Espera: Usa a posição calculada pelo DB (posicao_fila)
    filaDeEspera.sort((a, b) => (a.posicao_fila || Infinity) - (b.posicao_fila || Infinity));

    // Ordena convocados por prazo mais próximo
    convocados.sort((a, b) => {
        if (!a.convocacao_deadline) return 1;
        if (!b.convocacao_deadline) return -1;
        return new Date(a.convocacao_deadline).getTime() - new Date(b.convocacao_deadline).getTime();
    });

    // A posição na fila é agora o campo posicao_fila do DB, não precisamos simular a atribuição de posição
    const sortedFila = filaDeEspera;
    
    const totalFila = criancas.filter(c => c.status === "Fila de Espera").length;
    const comPrioridade = criancas.filter(c => c.status === "Fila de Espera" && c.programas_sociais).length;
    const totalConvocados = criancas.filter(c => c.status === "Convocado").length;
    
    const historico = criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada" || c.status === "Desistente" || c.status === "Recusada" || c.status === "Remanejamento Solicitado");

    return { 
        filteredFila: [...convocados, ...sortedFila], 
        historicoCriancas: historico,
        stats: { totalFila, comPrioridade, convocados: totalConvocados }
    };

  }, [criancas, cmeiFilter, prioridadeFilter, searchTerm]);

  // --- Handlers ---

  const handleExport = () => {
    toast.success("Exportação da Fila iniciada!", {
      description: "O arquivo da fila de espera será gerado e baixado em breve.",
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
  
  const handleConfirmarMatricula = async (id: string) => {
    // A função confirmarMatricula agora espera o ID da criança
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
        
        setIsJustificativaModalOpen(false);
        setCriancaToJustify(undefined);
        setCurrentJustificativaAction(undefined);
    } catch (e) {
        // Erro tratado pelo hook
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
  
  const handleReativar = async (id: string) => {
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
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10"
            onClick={handleExport}
          >
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

export default Fila;