import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, User, Plus, Edit, Eye, Trash2, MoreVertical, List, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaTurmaModal, { NovaTurmaFormInput } from "@/components/NovaTurmaModal";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTurmas } from "@/hooks/use-turmas";
import { useCMEIs } from "@/hooks/use-cmeis";
import { useTurmasBase } from "@/hooks/use-turmas-base";

// Definindo a interface de Turma com dados de relacionamento para exibição
interface TurmaDisplay {
  id: string;
  cmeiNome: string;
  turmaBaseNome: string;
  nomeCompleto: string; // Ex: Berçário I - Sala A
  capacidade: number;
  ocupacao: number;
  sala: string;
  turma_base_id: number;
  cmei_id: string;
  // Mock de alunos removido, usaremos ocupacao
}

const Turmas = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const cmeiFilterParam = searchParams.get("cmei");
  
  // Hooks de dados
  const { turmas, isLoading: isLoadingTurmas, deleteTurma, isDeleting } = useTurmas();
  const { cmeis, isLoading: isLoadingCmeis } = useCMEIs();
  const { turmasBase, isLoading: isLoadingTurmasBase } = useTurmasBase();
  
  const [selectedCmei, setSelectedCmei] = useState<string>(cmeiFilterParam || "todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<TurmaDisplay | undefined>(undefined);
  const [currentView, setCurrentView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (cmeiFilterParam && selectedCmei !== cmeiFilterParam) {
      setSelectedCmei(cmeiFilterParam);
    }
  }, [cmeiFilterParam, selectedCmei]);

  const handleCmeiChange = (value: string) => {
    setSelectedCmei(value);
    if (value === "todos") {
      searchParams.delete("cmei");
    } else {
      searchParams.set("cmei", value);
    }
    setSearchParams(searchParams);
  };

  // Mapeamento de dados para exibição
  const turmasDisplay: TurmaDisplay[] = useMemo(() => {
    if (!turmas || !cmeis || !turmasBase) return [];

    const cmeiMap = new Map((cmeis || []).map(c => [c.id, c.nome]));
    const turmaBaseMap = new Map((turmasBase || []).map(t => [t.id, t.nome]));

    return turmas.map(turma => ({
      id: turma.id,
      cmeiNome: cmeiMap.get(turma.cmei_id) || 'CMEI Desconhecido',
      turmaBaseNome: turmaBaseMap.get(turma.turma_base_id) || 'Modelo Desconhecido',
      nomeCompleto: turma.nome,
      capacidade: turma.capacidade,
      ocupacao: turma.ocupacao,
      sala: turma.sala,
      turma_base_id: turma.turma_base_id,
      cmei_id: turma.cmei_id,
    })) as TurmaDisplay[]; // Adicionando asserção de tipo para resolver o erro 21
  }, [turmas, cmeis, turmasBase]);

  const allCmeiNames = useMemo(() => (cmeis || []).map(c => c.nome), [cmeis]);
  const cmeiOptions = useMemo(() => (cmeis || []).map(c => ({ value: c.id, label: c.nome })), [cmeis]);
  const turmaBaseOptions = useMemo(() => (turmasBase || []).map(t => ({ id: t.id, nome: t.nome })), [turmasBase]);

  const filteredTurmas = turmasDisplay.filter(turma => {
    if (selectedCmei === "todos") return true;
    
    // Filtra pelo nome do CMEI, se o filtro for um nome (vindo da URL)
    if (cmeiFilterParam && selectedCmei === cmeiFilterParam) {
        return turma.cmeiNome === selectedCmei;
    }
    
    // Filtra pelo ID do CMEI, se o filtro for um ID (vindo do Select)
    const selectedCmeiObject = (cmeis || []).find(c => c.id === selectedCmei);
    if (selectedCmeiObject) {
        return turma.cmei_id === selectedCmei;
    }
    
    // Fallback para o caso de o filtro ser um nome (vindo da URL)
    return turma.cmeiNome === selectedCmei;
  });

  const groupedTurmas = filteredTurmas.reduce((acc, turma) => {
    if (!acc[turma.cmeiNome]) {
      acc[turma.cmeiNome] = [];
    }
    acc[turma.cmeiNome].push(turma);
    return acc;
  }, {} as Record<string, TurmaDisplay[]>);

  const handleDeleteTurma = async (id: string, nome: string) => {
    try {
        await deleteTurma(id);
        setIsModalOpen(false);
    } catch (e: any) {
        toast.error("Falha na Exclusão", {
            description: e.message,
        });
    }
  };

  const handleEditClick = (turma: TurmaDisplay) => {
    setEditingTurma({
      ...turma,
      cmei_id: turma.cmei_id,
      turma_base_id: turma.turma_base_id,
      capacidade: turma.capacidade,
      sala: turma.sala,
    });
    setIsModalOpen(true);
  };

  const handleNewTurmaClick = () => {
    setEditingTurma(undefined);
    setIsModalOpen(true);
  };
  
  const handleViewAllClick = (turma: TurmaDisplay) => {
    // Passamos o objeto TurmaDisplay para a página de detalhes
    navigate(`/admin/turmas/${turma.id}`, { state: { turma } });
  };

  const getInitialDataForModal = (): NovaTurmaFormInput & { id?: string } | undefined => {
    if (editingTurma) {
      return {
        id: editingTurma.id,
        cmei_id: editingTurma.cmei_id,
        turma_base_id: editingTurma.turma_base_id,
        capacidade: editingTurma.capacidade,
        sala: editingTurma.sala as NovaTurmaFormInput['sala'],
      };
    }
    // Preenche o CMEI se houver um filtro ativo (buscamos o ID do CMEI pelo nome)
    if (cmeiFilterParam && cmeiFilterParam !== "todos") {
        const cmeiObj = (cmeis || []).find(c => c.nome === cmeiFilterParam);
        if (cmeiObj) {
            return { cmei_id: cmeiObj.id, turma_base_id: 0, capacidade: 0, sala: "A" };
        }
    }
    return undefined;
  };

  const renderTurmaActions = (turma: TurmaDisplay) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewAllClick(turma)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEditClick(turma)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Turma
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Turma
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma 
                <span className="font-semibold"> {turma.nomeCompleto} </span>
                do CMEI {turma.cmeiNome}.
                {turma.ocupacao > 0 && (
                    <p className="mt-2 text-destructive font-semibold">Atenção: Esta turma possui {turma.ocupacao} crianças matriculadas/convocadas. A exclusão falhará se houver vínculos ativos.</p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteTurma(turma.id, turma.nomeCompleto)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderTurmasGrid = () => (
    Object.entries(groupedTurmas).map(([cmeiName, turmasList]) => (
      <div key={cmeiName} className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {cmeiName}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {turmasList.map((turma) => {
            const ocupacaoPercent = turma.capacidade > 0 ? Math.round((turma.ocupacao / turma.capacidade) * 100) : 0;
            
            return (
              <Card key={turma.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{turma.nomeCompleto}</CardTitle>
                      <CardDescription className="mt-1">
                        {turma.ocupacao} / {turma.capacidade} alunos ({turma.turmaBaseNome})
                      </CardDescription>
                    </div>
                    <Badge variant={ocupacaoPercent === 100 ? "default" : "secondary"}>
                      {ocupacaoPercent}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Ocupação</h4>
                    <div className="flex items-center justify-between p-2 border border-border rounded-lg">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Vagas Livres: {turma.capacidade - turma.ocupacao}</span>
                        </div>
                        <Badge variant={turma.capacidade - turma.ocupacao === 0 ? "destructive" : "secondary"}>
                            {turma.ocupacao} Ocupadas
                        </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewAllClick(turma)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    
                    {renderTurmaActions(turma)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    ))
  );

  const renderTurmasList = () => {
    if (filteredTurmas.length === 0) {
      return (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Nenhuma turma encontrada para o filtro selecionado.
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CMEI</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Modelo Base</TableHead>
                <TableHead className="text-center">Capacidade</TableHead>
                <TableHead className="text-center">Ocupação</TableHead>
                <TableHead className="text-center">Vagas Livres</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTurmas.map((turma) => (
                <TableRow key={turma.id}>
                  <TableCell className="font-medium">{turma.cmeiNome}</TableCell>
                  <TableCell>{turma.nomeCompleto}</TableCell>
                  <TableCell>{turma.turmaBaseNome}</TableCell>
                  <TableCell className="text-center">{turma.capacidade}</TableCell>
                  <TableCell className="text-center">{turma.ocupacao}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={turma.capacidade - turma.ocupacao === 0 ? "destructive" : "secondary"}>
                      {turma.capacidade - turma.ocupacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {renderTurmaActions(turma)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };
  
  const isLoadingData = isLoadingTurmas || isLoadingCmeis || isLoadingTurmasBase;

  if (isLoadingData) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando dados de turmas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
            <p className="text-muted-foreground">Visualização e gerenciamento de turmas por CMEI</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={handleNewTurmaClick}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <NovaTurmaModal
              initialData={getInitialDataForModal()}
              onClose={() => setIsModalOpen(false)}
            />
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Select onValueChange={handleCmeiChange} value={selectedCmei}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por CMEI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os CMEIs</SelectItem>
                  {(cmeis || []).map(cmei => (
                    <SelectItem key={cmei.id} value={cmei.id}>{cmei.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ToggleGroup 
                type="single" 
                value={currentView}
                onValueChange={(value) => {
                  if (value) {
                    setCurrentView(value as "grid" | "list");
                  }
                }}
                className="flex-shrink-0"
              >
                <ToggleGroupItem value="grid" aria-label="Visualizar em grade">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Visualizar em lista">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
        </Card>
        
        {currentView === "grid" ? renderTurmasGrid() : renderTurmasList()}
        
      </div>
    </AdminLayout>
  );
};

export default Turmas;