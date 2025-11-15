import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, MapPin, Users, Edit, Trash2, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaTurmaModal, { NovaTurmaFormInput } from "@/components/NovaTurmaModal";
import { useState } from "react";
import { useTurmas } from "@/hooks/use-turmas";
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

// Interface de dados de exibição (TurmaDisplay)
interface TurmaDisplay {
  id: string;
  cmeiNome: string;
  turmaBaseNome: string;
  nomeCompleto: string;
  capacidade: number;
  ocupacao: number;
  sala: string;
  turma_base_id: number;
  cmei_id: string;
}

// Mock de alunos (temporário, até integrarmos a tabela 'criancas')
const mockAlunos = [
    "Ana Silva", "João Pedro", "Maria Clara", "Lucas Silva", "Beatriz Costa", 
    "Felipe Souza", "Giovana Lima", "Henrique Rocha", "Isadora Mendes", "Júlia Nunes", 
    "Kevin Pires", "Lívia Martins", "Matheus Gomes", "Nicole Ferreira", "Otávio Barbosa"
];


const DetalhesTurma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const turma = location.state?.turma as TurmaDisplay | undefined;
  const { deleteTurma, isDeleting } = useTurmas();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!turma) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              Detalhes da turma não encontrados.
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  // Mock: Usamos a ocupação real, mas a lista de alunos é mockada
  const alunosNaTurma = mockAlunos.slice(0, turma.ocupacao);

  const ocupacaoPercent = turma.capacidade > 0 ? Math.round((turma.ocupacao / turma.capacidade) * 100) : 0;
  const vagasDisponiveis = turma.capacidade - turma.ocupacao;
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Não precisamos de refetch aqui, pois a edição é feita na página Turmas.tsx
    // Se a edição for bem-sucedida, o usuário deve ser redirecionado ou a página deve ser atualizada manualmente.
    // Por simplicidade, vamos apenas fechar o modal.
  };
  
  const handleEditClick = () => {
    setIsModalOpen(true);
  };
  
  const handleDelete = async () => {
    try {
        await deleteTurma(turma.id);
        navigate('/admin/turmas');
    } catch (e: any) {
        toast.error("Falha na Exclusão", {
            description: e.message,
        });
    }
  };
  
  const getInitialDataForModal = (): NovaTurmaFormInput & { id?: string } => ({
    id: turma.id,
    cmei_id: turma.cmei_id,
    turma_base_id: turma.turma_base_id,
    capacidade: turma.capacidade,
    sala: turma.sala as NovaTurmaFormInput['sala'],
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{turma.nomeCompleto}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {turma.cmeiNome}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Turmas
            </Button>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/10" onClick={handleEditClick}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Turma
                    </Button>
                </DialogTrigger>
                <NovaTurmaModal
                    initialData={getInitialDataForModal()}
                    onClose={handleModalClose}
                />
            </Dialog>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma 
                            <span className="font-semibold"> {turma.nomeCompleto} </span>
                            e removerá todos os dados associados.
                            {turma.ocupacao > 0 && (
                                <p className="mt-2 text-destructive font-semibold">Atenção: Esta turma possui {turma.ocupacao} crianças matriculadas/convocadas. A exclusão falhará se houver vínculos ativos.</p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capacidade</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{turma.capacidade} vagas</div>
              <p className="text-xs text-muted-foreground">Sala {turma.sala}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupação</CardTitle>
              <Badge variant="secondary">{ocupacaoPercent}%</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{turma.ocupacao} alunos</div>
              <p className="text-xs text-muted-foreground">Vagas disponíveis: {vagasDisponiveis}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modelo Base</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{turma.turmaBaseNome}</div>
              <p className="text-xs text-muted-foreground">Faixa etária correspondente</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos ({alunosNaTurma.length})</CardTitle>
            <CardDescription>Alunos atualmente matriculados nesta turma.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Nome do Aluno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosNaTurma.map((aluno, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {aluno}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-secondary/20 text-secondary">Matriculado</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {alunosNaTurma.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum aluno matriculado nesta turma.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DetalhesTurma;