import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaTurmaBaseModal, { TurmaBaseFormData } from "@/components/NovaTurmaBaseModal";
import { toast } from "sonner";
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

interface TurmaBase extends TurmaBaseFormData {
  id: number;
}

const TurmasBase = () => {
  const [turmasBase, setTurmasBase] = useState<TurmaBase[]>([
    {
      id: 1,
      nome: "Berçário I",
      idadeMinima: 4,
      idadeMaxima: 11,
      // capacidade: 15, // Removido
      descricao: "4 a 11 meses"
    },
    {
      id: 2,
      nome: "Berçário II",
      idadeMinima: 12,
      idadeMaxima: 23,
      // capacidade: 15, // Removido
      descricao: "1 ano"
    },
    {
      id: 3,
      nome: "Maternal I",
      idadeMinima: 24,
      idadeMaxima: 35,
      // capacidade: 20, // Removido
      descricao: "2 anos"
    },
    {
      id: 4,
      nome: "Maternal II",
      idadeMinima: 36,
      idadeMaxima: 47,
      // capacidade: 20, // Removido
      descricao: "3 anos"
    },
    {
      id: 5,
      nome: "Pré I",
      idadeMinima: 48,
      idadeMaxima: 59,
      // capacidade: 25, // Removido
      descricao: "4 anos"
    },
    {
      id: 6,
      nome: "Pré II",
      idadeMinima: 60,
      idadeMaxima: 71,
      // capacidade: 25, // Removido
      descricao: "5 anos"
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurmaBase, setEditingTurmaBase] = useState<TurmaBase | undefined>(undefined);

  const handleSaveTurma = (data: TurmaBaseFormData & { id?: number }) => {
    if (data.id) {
      // Edição
      setTurmasBase(turmasBase.map(t => t.id === data.id ? { ...t, ...data } : t));
      toast.success("Turma base atualizada com sucesso!");
    } else {
      // Nova turma
      const newId = turmasBase.length > 0 ? Math.max(...turmasBase.map(t => t.id)) + 1 : 1;
      setTurmasBase([...turmasBase, { id: newId, ...data }]);
      toast.success("Turma base cadastrada com sucesso!");
    }
    setEditingTurmaBase(undefined);
    setIsModalOpen(false);
  };

  const handleDeleteTurma = (id: number) => {
    setTurmasBase(turmasBase.filter(turma => turma.id !== id));
    toast.success("Turma base excluída com sucesso!");
    setIsModalOpen(false); // Fecha o modal após a exclusão
  };

  const handleEditClick = (turma: TurmaBase) => {
    setEditingTurmaBase(turma);
    setIsModalOpen(true);
  };

  const handleNewTurmaClick = () => {
    setEditingTurmaBase(undefined);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Turmas Base</h1>
            <p className="text-muted-foreground">Configuração dos modelos de turmas com faixas etárias</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={handleNewTurmaClick}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Turma Base
              </Button>
            </DialogTrigger>
            <NovaTurmaBaseModal 
              initialData={editingTurmaBase} 
              onSave={handleSaveTurma} 
              onClose={() => setIsModalOpen(false)} 
              onDelete={handleDeleteTurma}
            />
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmasBase.map((turma) => (
            <Card key={turma.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{turma.nome}</CardTitle>
                      <CardDescription>{turma.descricao}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Faixa Etária:</span>
                    <Badge variant="secondary">{turma.descricao || `${turma.idadeMinima} - ${turma.idadeMaxima} meses`}</Badge>
                  </div>
                  {/* Capacidade removida da exibição */}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(turma)}>
                    <Edit className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma base 
                          <span className="font-semibold"> {turma.nome} </span>
                          e removerá todos os dados associados.
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* O formulário de adição inline foi removido, pois agora usamos o modal */}
      </div>
    </AdminLayout>
  );
};

export default TurmasBase;