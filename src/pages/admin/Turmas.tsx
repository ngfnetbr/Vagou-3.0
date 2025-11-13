import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, User, Plus, Edit, Eye, Trash2, MoreVertical, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaTurmaModal, { NovaTurmaFormData } from "@/components/NovaTurmaModal";
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

interface Turma {
  id: number;
  cmei: string;
  nome: string; // Ex: Berçário I - Sala A
  capacidade: number;
  ocupacao: number;
  alunos: string[];
  turmaBaseId: number;
  sala: string; // Alterado de 'turno' para 'sala'
}

// Dados mockados de Turmas Base (para seleção no modal)
const mockTurmasBase = [
  { id: 1, nome: "Berçário I" },
  { id: 2, nome: "Berçário II" },
  { id: 3, nome: "Maternal I" },
  { id: 4, nome: "Maternal II" },
  { id: 5, nome: "Pré I" },
  { id: 6, nome: "Pré II" },
];

// Dados mockados iniciais (ajustados para o novo formato)
const initialTurmasData: Turma[] = [
  {
    id: 1,
    cmei: "CMEI Centro",
    nome: "Berçário I - Sala A",
    capacidade: 15,
    ocupacao: 15,
    alunos: ["Ana Silva", "João Pedro", "Maria Clara", "Lucas Silva", "Beatriz Costa", "Felipe Souza", "Giovana Lima", "Henrique Rocha", "Isadora Mendes", "Júlia Nunes", "Kevin Pires", "Lívia Martins", "Matheus Gomes", "Nicole Ferreira", "Otávio Barbosa"],
    turmaBaseId: 1,
    sala: "A",
  },
  {
    id: 2,
    cmei: "CMEI Centro",
    nome: "Maternal I - Sala B",
    capacidade: 20,
    ocupacao: 18,
    alunos: ["Carlos Eduardo", "Julia Santos", "Pedro Henrique", "Laura Oliveira", "Ricardo Alves", "Samanta Dias", "Thiago Vieira", "Vitória Castro", "Wallace Neves", "Xavier Rocha", "Yasmin Lopes", "Zoe Pereira", "Alice Ribeiro", "Bruno Fernandes", "Cecília Gonzaga", "Daniela Pinho", "Enzo Queiroz", "Fernanda Ramos"],
    turmaBaseId: 3,
    sala: "B",
  },
  {
    id: 3,
    cmei: "CMEI Norte",
    nome: "Maternal II - Sala A",
    capacidade: 20,
    ocupacao: 19,
    alunos: ["Rafaela Lima", "Gabriel Costa", "Isabela Silva", "Miguel Santos", "Heloísa Almeida", "Igor Barbosa", "Janaína Carvalho", "Kauã Dantas", "Larissa Evangelista", "Marcelo Freitas", "Natália Guedes", "Osvaldo Horta", "Patrícia Iunes", "Quiteria Jardim", "Renato Kley", "Silvia Lemos", "Tadeu Moura", "Úrsula Nogueira", "Vitor Oliveira"],
    turmaBaseId: 4,
    sala: "A",
  },
  {
    id: 4,
    cmei: "CMEI Norte",
    nome: "Pré I - Sala C",
    capacidade: 25,
    ocupacao: 22,
    alunos: ["Sofia Alves", "Davi Oliveira", "Helena Costa", "Arthur Silva", "Bernardo Ferreira", "Clara Gomes", "Eduardo Henrique", "Giovanna Iara", "Hugo Jesus", "Ingrid Kelly", "Joaquim Lima", "Kátia Mendes", "Luiz Neto", "Mirella Ortiz", "Nuno Prado", "Olívia Quintela", "Paulo Rocha", "Quésia Santos", "Rafael Toledo", "Sara Uchoa", "Téo Viana", "Ulisses Xavier"],
    turmaBaseId: 5,
    sala: "C",
  },
];

const Turmas = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const cmeiFilterParam = searchParams.get("cmei");
  const [selectedCmei, setSelectedCmei] = useState<string>(cmeiFilterParam || "todos");
  const [turmas, setTurmas] = useState<Turma[]>(initialTurmasData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | undefined>(undefined);
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

  const allCmeiNames = Array.from(new Set(initialTurmasData.map(data => data.cmei)));
  const cmeiOptions = allCmeiNames.map(name => ({ value: name, label: name }));

  const filteredTurmas = turmas.filter(turma => selectedCmei === "todos" || turma.cmei === selectedCmei);

  const groupedTurmas = filteredTurmas.reduce((acc, turma) => {
    if (!acc[turma.cmei]) {
      acc[turma.cmei] = [];
    }
    acc[turma.cmei].push(turma);
    return acc;
  }, {} as Record<string, Turma[]>);

  const handleSaveTurma = (data: NovaTurmaFormData & { id?: number }) => {
    const baseTurma = mockTurmasBase.find(t => String(t.id) === data.turmaBaseId);
    // Nome da turma agora usa a Sala
    const nomeCompleto = `${baseTurma?.nome || 'Turma'} - Sala ${data.sala}`;

    if (data.id) {
      // Edição
      setTurmas(turmas.map(t => t.id === data.id ? { 
        ...t, 
        capacidade: data.capacidade, 
        sala: data.sala,
        nome: nomeCompleto,
      } : t));
      toast.success("Turma atualizada com sucesso!");
    } else {
      // Nova turma
      const newId = turmas.length > 0 ? Math.max(...turmas.map(t => t.id)) + 1 : 1;
      setTurmas([...turmas, { 
        id: newId, 
        cmei: data.cmei, 
        nome: nomeCompleto,
        capacidade: data.capacidade, 
        ocupacao: 0,
        alunos: [],
        turmaBaseId: Number(data.turmaBaseId),
        sala: data.sala,
      }]);
      toast.success("Turma cadastrada com sucesso!");
    }
    setEditingTurma(undefined);
    setIsModalOpen(false);
  };

  const handleDeleteTurma = (id: number) => {
    setTurmas(turmas.filter(turma => turma.id !== id));
    toast.success("Turma excluída com sucesso!");
    setIsModalOpen(false);
  };

  const handleEditClick = (turma: Turma) => {
    setEditingTurma({
      ...turma,
      turmaBaseId: turma.turmaBaseId,
      cmei: turma.cmei,
      nome: turma.nome,
      capacidade: turma.capacidade,
      sala: turma.sala,
    });
    setIsModalOpen(true);
  };

  const handleNewTurmaClick = () => {
    setEditingTurma(undefined);
    setIsModalOpen(true);
  };
  
  const handleViewAllClick = (turma: Turma) => {
    navigate(`/admin/turmas/${turma.id}`, { state: { turma } });
  };

  const getInitialDataForModal = () => {
    if (editingTurma) {
      return {
        id: editingTurma.id,
        cmei: editingTurma.cmei,
        turmaBaseId: String(editingTurma.turmaBaseId),
        nome: editingTurma.nome,
        capacidade: editingTurma.capacidade,
        sala: editingTurma.sala as NovaTurmaFormData['sala'],
      };
    }
    // Preenche o CMEI se houver um filtro ativo
    return cmeiFilterParam && cmeiFilterParam !== "todos" ? { cmei: cmeiFilterParam } : undefined;
  };

  const renderTurmaActions = (turma: Turma) => (
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
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Turma
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma 
                <span className="font-semibold"> {turma.nome} </span>
                do CMEI {turma.cmei}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteTurma(turma.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
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
            const ocupacaoPercent = Math.round((turma.ocupacao / turma.capacidade) * 100);
            const baseTurma = mockTurmasBase.find(t => t.id === turma.turmaBaseId);
            
            return (
              <Card key={turma.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{turma.nome}</CardTitle>
                      <CardDescription className="mt-1">
                        {turma.ocupacao} / {turma.capacidade} alunos ({baseTurma?.nome})
                      </CardDescription>
                    </div>
                    <Badge variant={ocupacaoPercent === 100 ? "default" : "secondary"}>
                      {ocupacaoPercent}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Alunos Matriculados</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {turma.alunos.slice(0, 5).map((aluno, alunoIndex) => (
                        <div 
                          key={alunoIndex}
                          className="flex items-center justify-between p-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{aluno}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            Ver
                          </Button>
                        </div>
                      ))}
                      {turma.alunos.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          + {turma.alunos.length - 5} alunos
                        </p>
                      )}
                      {turma.alunos.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nenhum aluno matriculado nesta turma.
                        </p>
                      )}
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
                      Ver Todos
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-1/2">
                          <MoreVertical className="mr-2 h-4 w-4" />
                          Gerenciar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(turma)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Turma
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir Turma
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma 
                                <span className="font-semibold"> {turma.nome} </span>
                                do CMEI {turma.cmei}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTurma(turma.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                {/* Removendo a coluna CMEI, pois será o agrupador */}
                <TableHead>Turma</TableHead>
                <TableHead>Modelo Base</TableHead>
                <TableHead className="text-center">Capacidade</TableHead>
                <TableHead className="text-center">Ocupação</TableHead>
                <TableHead className="text-center">Vagas Livres</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedTurmas).map(([cmeiName, turmasList]) => (
                <>
                  <TableRow key={cmeiName} className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={6} className="font-bold text-primary text-lg">
                      {cmeiName}
                    </TableCell>
                  </TableRow>
                  {turmasList.map((turma) => {
                    const baseTurma = mockTurmasBase.find(t => t.id === turma.turmaBaseId);
                    
                    return (
                      <TableRow key={turma.id}>
                        <TableCell className="font-medium">{turma.nome}</TableCell>
                        <TableCell>{baseTurma?.nome}</TableCell>
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
                    );
                  })}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

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
              onSave={handleSaveTurma}
              onClose={() => setIsModalOpen(false)}
              cmeiOptions={cmeiOptions}
              turmaBaseOptions={mockTurmasBase}
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
                  {allCmeiNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
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

        {/* A verificação de turmas vazias agora é feita dentro de renderTurmasList e renderTurmasGrid */}
        
        {currentView === "grid" ? renderTurmasGrid() : renderTurmasList()}
        
      </div>
    </AdminLayout>
  );
};

export default Turmas;