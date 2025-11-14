import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import TurmaBaseModal, { TurmaBaseFormInput } from "@/components/TurmaBaseModal";
import { useTurmasBase } from "@/hooks/use-turmas-base"; // Importando o hook
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

// Definindo a interface local para TurmaBase (usando o tipo do hook)
interface TurmaBase extends TurmaBaseFormInput {
  id: number;
}

const TurmasBase = () => {
  const { 
    turmasBase, 
    isLoading, 
    error, 
    deleteTurmaBase, 
    isDeleting,
    isCreating,
    isUpdating
  } = useTurmasBase();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurmaBase, setEditingTurmaBase] = useState<TurmaBase | undefined>(undefined);

  const handleEditClick = (turma: TurmaBase) => {
    // Mapeia TurmaBase (com id_minima_meses) para TurmaBaseFormInput (com idadeMinima)
    setEditingTurmaBase({
        id: turma.id,
        nome: turma.nome,
        idadeMinima: turma.idade_minima_meses,
        idadeMaxima: turma.idade_maxima_meses,
        descricao: turma.descricao || "",
    });
    setIsModalOpen(true);
  };

  const handleNewTurmaClick = () => {
    setEditingTurmaBase(undefined);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTurmaBase(undefined);
  };

  const handleDeleteTurma = async (id: number) => {
    await deleteTurmaBase(id);
    handleModalClose();
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando modelos de turmas...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          Erro ao carregar Turmas Base: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Modelos de Turmas</h2>
          <p className="text-muted-foreground">Configuração dos modelos de turmas com faixas etárias</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={handleNewTurmaClick}
              disabled={isCreating || isUpdating}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma Base
            </Button>
          </DialogTrigger>
          <TurmaBaseModal
            initialData={editingTurmaBase}
            onClose={handleModalClose}
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
                  <Badge variant="secondary">
                    {turma.idade_minima_meses} - {turma.idade_maxima_meses} meses
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(turma)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" disabled={isDeleting}>
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
                      <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteTurma(turma.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TurmasBase;