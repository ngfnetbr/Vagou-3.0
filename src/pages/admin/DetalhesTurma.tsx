import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, MapPin, Users, Edit, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface TurmaDetails {
  id: number;
  cmei: string;
  nome: string;
  capacidade: number;
  ocupacao: number;
  alunos: string[];
  turmaBaseId: number;
  sala: string;
}

const DetalhesTurma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const turma = location.state?.turma as TurmaDetails | undefined;

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

  const ocupacaoPercent = Math.round((turma.ocupacao / turma.capacidade) * 100);
  const vagasDisponiveis = turma.capacidade - turma.ocupacao;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{turma.nome}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {turma.cmei}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Turmas
            </Button>
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
              <Edit className="mr-2 h-4 w-4" />
              Editar Turma
            </Button>
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
              <div className="text-2xl font-bold">ID {turma.turmaBaseId}</div>
              <p className="text-xs text-muted-foreground">Faixa etária correspondente</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista Completa de Alunos ({turma.alunos.length})</CardTitle>
            <CardDescription>Todos os alunos matriculados nesta turma.</CardDescription>
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
                {turma.alunos.map((aluno, index) => (
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
                {turma.alunos.length === 0 && (
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