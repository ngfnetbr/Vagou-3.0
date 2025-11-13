import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MoreVertical, Loader2, Eye, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import JustificativaModal from "@/components/JustificativaModal";
import { Crianca } from "@/lib/mock-data";

const mockTurmas = [
  "Berçário I", "Berçário II", "Maternal I", "Maternal II", "Pré I", "Pré II"
];

const Matriculas = () => {
  const { criancas, isLoading, marcarDesistente, isMarkingDesistente } = useCriancas();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cmeiFilter, setCmeiFilter] = useState("todos");
  const [turmaFilter, setTurmaFilter] = useState("todas");
  
  const [isJustificativaModalOpen, setIsJustificativaModalOpen] = useState(false);
  const [criancaToDesist, setCriancaToDesist] = useState<Crianca | undefined>(undefined);

  const matriculasAtivas = useMemo(() => {
    let filtered = criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada");

    if (cmeiFilter !== "todos") {
      filtered = filtered.filter(c => c.cmei === cmeiFilter);
    }

    if (turmaFilter !== "todas") {
      // Filter by checking if turmaAtual includes the selected turma base name
      filtered = filtered.filter(c => c.turmaAtual?.includes(turmaFilter));
    }
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(lowerCaseSearch) ||
        c.responsavel.toLowerCase().includes(lowerCaseSearch)
      );
    }

    return filtered;
  }, [criancas, cmeiFilter, turmaFilter, searchTerm]);
  
  // Get list of unique CMEIs where children are currently matriculated
  const allCmeiNames = useMemo(() => Array.from(new Set(criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada").map(c => c.cmei))).filter(name => name !== 'N/A'), [criancas]);

  const handleMarkDesistenteClick = (crianca: Crianca) => {
    setCriancaToDesist(crianca);
    setIsJustificativaModalOpen(true);
  };
  
  const handleJustificativaConfirm = async (justificativa: string) => {
    if (!criancaToDesist) return;
    
    await marcarDesistente({ id: criancaToDesist.id, justificativa });
    
    setIsJustificativaModalOpen(false);
    setCriancaToDesist(undefined);
  };
  
  const handleViewDetails = (id: number) => {
    navigate(`/admin/criancas/${id}`);
  };
  
  const handleTransfer = (action: string) => {
    toast.info("Funcionalidade em desenvolvimento", {
        description: `A ação de '${action}' será implementada em breve.`
    });
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando matrículas ativas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Matrículas</h1>
            <p className="text-muted-foreground">Gerenciamento completo de matrículas ativas</p>
          </div>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome da criança ou responsável..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select onValueChange={setCmeiFilter} value={cmeiFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por CMEI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os CMEIs</SelectItem>
                    {allCmeiNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setTurmaFilter} value={turmaFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {mockTurmas.map(turma => (
                        <SelectItem key={turma} value={turma}>{turma}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criança</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>CMEI</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculasAtivas.length > 0 ? (
                    matriculasAtivas.map((matricula) => (
                      <TableRow key={matricula.id}>
                        <TableCell className="font-medium">{matricula.nome}</TableCell>
                        <TableCell>{matricula.responsavel}</TableCell>
                        <TableCell>{matricula.cmei}</TableCell>
                        <TableCell>{matricula.turmaAtual || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                            {matricula.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(matricula.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTransfer('Realocar')}>
                                Realocar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTransfer('Solicitar remanejamento')}>
                                Solicitar remanejamento
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTransfer('Transferir')}>
                                Transferir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTransfer('Trancar matrícula')}>
                                Trancar matrícula
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleMarkDesistenteClick(matricula)}
                                disabled={isMarkingDesistente}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Marcar como desistente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Nenhuma matrícula ativa encontrada com os filtros aplicados.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Justificativa para Desistência */}
      <Dialog open={isJustificativaModalOpen} onOpenChange={setIsJustificativaModalOpen}>
        {criancaToDesist && (
          <JustificativaModal
            title={`Marcar ${criancaToDesist.nome} como Desistente`}
            description="Confirme a desistência. A criança será marcada como 'Desistente' e removida da lista de matrículas ativas."
            actionLabel="Confirmar Desistência"
            onConfirm={handleJustificativaConfirm}
            onClose={() => {
              setIsJustificativaModalOpen(false);
              setCriancaToDesist(undefined);
            }}
            isPending={isMarkingDesistente}
          />
        )}
      </Dialog>
    </AdminLayout>
  );
};

export default Matriculas;