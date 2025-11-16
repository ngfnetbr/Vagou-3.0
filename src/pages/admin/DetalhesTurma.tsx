import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, MapPin, Users, Edit, Trash2, Loader2, Eye } from "lucide-react";
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
import { useCriancasByTurma } from "@/hooks/use-criancas"; // Importando o novo hook
import { Crianca } from "@/integrations/supabase/types"; // Importando a tipagem de Crianca

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

const DetalhesTurma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const turma = location.state?.turma as TurmaDisplay | undefined;
  const { deleteTurma, isDeleting } = useTurmas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Busca as crianças reais da turma
  const { data: alunosNaTurma, isLoading: isLoadingAlunos, error: errorAlunos } = useCriancasByTurma(turma?.id);

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
  
  const ocupacaoReal = alunosNaTurma?.length || 0;
  const ocupacaoPercent = turma.capacidade > 0 ? Math.round((ocupacaoReal / turma.capacidade) * 100) : 0;
  const vagasDisponiveis = turma.capacidade - ocupacaoReal;
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Nota: A atualização da ocupação do CMEI/Turma é feita via trigger no DB.
    // Se a edição da turma mudar a capacidade, a página Turmas.tsx deve ser recarregada.
    // Para garantir que a ocupação real seja refletida aqui, o hook useCriancasByTurma fará o trabalho.
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
  
  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary/20 text-secondary", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary/20 text-secondary", text: "Matriculado" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
      "Remanejamento Solicitado": { className: "bg-accent/20 text-foreground", text: "Remanejamento Solicitado" },
      // Fallbacks (não devem ocorrer aqui, mas por segurança)
      "Fila de Espera": { className: "bg-muted/50 text-muted-foreground", text: "Fila de Espera" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
    };
    
    const config = variants[status] || { className: "bg-muted/50 text-muted-foreground", text: status };
    return <Badge className={config.className}>{config.text}</Badge>;
  };


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
                            {ocupacaoReal > 0 && (
                                <p className="mt-2 text-destructive font-semibold">Atenção: Esta turma possui {ocupacaoReal} crianças matriculadas/convocadas. A exclusão falhará se houver vínculos ativos.</p>
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
              <div className="text-2xl font-bold text-primary">{ocupacaoReal} alunos</div>
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
            <CardTitle>Lista de Alunos ({ocupacaoReal})</CardTitle>
            <CardDescription>Alunos atualmente matriculados ou convocados para esta turma.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAlunos ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-lg text-muted-foreground">Carregando alunos...</p>
                </div>
            ) : errorAlunos ? (
                <div className="text-center text-destructive py-4">
                    Erro ao carregar alunos: {errorAlunos.message}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Nome do Aluno</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Idade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {alunosNaTurma && alunosNaTurma.length > 0 ? (
                            alunosNaTurma.map((aluno, index) => (
                                <TableRow key={aluno.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {aluno.nome}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(aluno.status)}
                                    </TableCell>
                                    <TableCell>
                                        {aluno.idade}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/criancas/${aluno.id}`)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    Nenhum aluno matriculado ou convocado para esta turma.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DetalhesTurma;