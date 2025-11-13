import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, User, Plus, Edit, Eye, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
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
    alunos: ["Ana Silva", "João Pedro", "Maria Clara", "Lucas Silva", "Beatriz Costa"],
    turmaBaseId: 1,
    sala: "A",
  },
  {
    id: 2,
    cmei: "CMEI Centro",
    nome: "Maternal I - Sala B",
    capacidade: 20,
    ocupacao: 18,
    alunos: ["Carlos Eduardo", "Julia Santos", "Pedro Henrique", "Laura Oliveira"],
    turmaBaseId: 3,
    sala: "B",
  },
  {
    id: 3,
    cmei: "CMEI Norte",
    nome: "Maternal II - Sala A",
    capacidade: 20,
    ocupacao: 19,
    alunos: ["Rafaela Lima", "Gabriel Costa", "Isabela Silva", "Miguel Santos"],
    turmaBaseId: 4,
    sala: "A",
  },
  {
    id: 4,
    cmei: "CMEI Norte",
    nome: "Pré I - Sala C",
    capacidade: 25,
    ocupacao: 22,
    alunos: ["Sofia Alves", "Davi Oliveira", "Helena Costa", "Arthur Silva"],
    turmaBaseId: 5,
    sala: "C",
  },
];

const Turmas = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const cmeiFilterParam = searchParams.get("cmei");
  const [selectedCmei, setSelectedCmei] = useState<string>(cmeiFilterParam || "todos");
  const [turmas, setTurmas] = useState<Turma[]>(initialTurmasData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | undefined>(undefined);

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
        sala: data.sala, // Alterado de turno para sala
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
        ocupacao: 0, // Nova turma começa com 0 ocupação
        alunos: [],
        turmaBaseId: Number(data.turmaBaseId),
        sala: data.sala, // Alterado de turno para sala
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
      sala: turma.sala, // Alterado de turno para sala
    });
    setIsModalOpen(true);
  };

  const handleNewTurmaClick = () => {
    setEditingTurma(undefined);
    setIsModalOpen(true);
  };

  const getInitialDataForModal = () => {
    if (editingTurma) {
      return {
        id: editingTurma.id,
        cmei: editingTurma.cmei,
        turmaBaseId: String(editingTurma.turmaBaseId),
        nome: editingTurma.nome,
        capacidade: editingTurma.capacidade,
        sala: editingTurma.sala as NovaTurmaFormData['sala'], // Alterado de turno para sala
      };
    }
    // Preenche o CMEI se houver um filtro ativo
    return cmeiFilterParam && cmeiFilterParam !== "todos" ? { cmei: cmeiFilterParam } : undefined;
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
            <div className="flex gap-4">
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
            </div>
          </CardHeader>
        </Card>

        {Object.keys(groupedTurmas).length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Nenhuma turma encontrada para o filtro selecionado.
            </CardContent>
          </Card>
        )}

        {Object.entries(groupedTurmas).map(([cmeiName, turmasList]) => (
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
                        <Button variant="outline" size="sm" className="flex-1">
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
        ))}
      </div>
    </AdminLayout>
  );
};

export default Turmas;