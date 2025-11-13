import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, List, Grid, Eye, Trash2, Calendar, MapPin, Loader2 } from "lucide-react";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { Crianca, CriancaStatus } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { NovaCriancaModal } from "@/components/NovaCriancaModal";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "table" | "grid";

const Criancas = () => {
  const { criancas, isLoading, deleteCrianca } = useCriancas();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredCriancas = useMemo(() => {
    if (!criancas) return [];

    let filtered = criancas;

    // 1. Apply Status filter
    if (statusFilter !== "todos") {
      // Corrigido: Usando apenas os status definidos em CriancaStatus
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // 2. Apply Search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nomeCrianca.toLowerCase().includes(lowerCaseSearch) ||
        c.nomeResponsavel.toLowerCase().includes(lowerCaseSearch)
      );
    }

    return filtered;
  }, [criancas, statusFilter, searchTerm]);

  const getStatusBadge = (status: CriancaStatus) => {
    // Corrigido: Removendo 'Matriculada' que não existe no tipo CriancaStatus
    const variants: Record<CriancaStatus, { variant: "default" | "secondary" | "outline" | "destructive", className: string }> = {
      "Matriculado": { variant: "default", className: "bg-secondary text-secondary-foreground" },
      "Fila de Espera": { variant: "outline", className: "border-primary text-primary" },
      "Convocado": { variant: "secondary", className: "bg-yellow-500/20 text-yellow-700 border-yellow-700" },
      "Desistente": { variant: "destructive", className: "" },
    };

    const { variant, className } = variants[status] || { variant: "outline", className: "" };

    return (
      <Badge variant={variant} className={className}>
        {status}
      </Badge>
    );
  };

  const handleDelete = async (id: number, nome: string) => {
    await deleteCrianca(id);
    toast.success(`Criança ${nome} excluída com sucesso.`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando dados das crianças...</p>
        </div>
      </AdminLayout>
    );
  }

  const allCmeiNames = Array.from(new Set(criancas.map(c => c.cmei1))).filter(Boolean);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crianças Cadastradas</h1>
            <p className="text-muted-foreground">Gerenciamento de todas as crianças no sistema.</p>
          </div>
          <NovaCriancaModal />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome da criança ou responsável..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="Fila de Espera">Fila de Espera</SelectItem>
                    <SelectItem value="Convocado">Convocado</SelectItem>
                    <SelectItem value="Matriculado">Matriculado</SelectItem>
                    <SelectItem value="Desistente">Desistente</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "bg-muted" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-muted" : ""}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCriancas.map((crianca) => (
                  <Card key={crianca.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{crianca.nomeCrianca}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(crianca.dataNascimento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                          </CardDescription>
                        </div>
                        {getStatusBadge(crianca.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Responsável:</span>
                        <span className="font-medium">{crianca.nomeResponsavel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sexo:</span>
                        <span className="font-medium">{crianca.sexo === 'masculino' ? 'Masculino' : 'Feminino'}</span>
                      </div>
                      {crianca.cmei1 && (
                        <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-primary">{crianca.cmei1}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/admin/criancas/${crianca.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                        <NovaCriancaModal isEditing initialData={crianca} criancaId={crianca.id} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criança</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CMEI</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCriancas.length > 0 ? (
                    filteredCriancas.map((crianca) => (
                      <TableRow key={crianca.id}>
                        <TableCell className="font-medium">{crianca.nomeCrianca}</TableCell>
                        <TableCell>{crianca.nomeResponsavel}</TableCell>
                        <TableCell>{format(new Date(crianca.dataNascimento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell>{getStatusBadge(crianca.status)}</TableCell>
                        <TableCell>{crianca.cmei1 || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate(`/admin/criancas/${crianca.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <NovaCriancaModal isEditing initialData={crianca} criancaId={crianca.id} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a criança 
                                    <span className="font-semibold"> {crianca.nomeCrianca} </span>
                                    e todos os seus registros.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(crianca.id, crianca.nomeCrianca)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhuma criança encontrada com os filtros aplicados.
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

export default Criancas;