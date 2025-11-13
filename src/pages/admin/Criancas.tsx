import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, Calendar, MapPin, List, LayoutGrid, MoreVertical, Eye, Edit, Loader2, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaCriancaModalContent from "@/components/NovaCriancaModal";
import { useCriancas } from "@/hooks/use-criancas";
import { Crianca } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
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


const Criancas = () => {
  const { criancas, isLoading, deleteCrianca, isDeleting } = useCriancas();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrianca, setEditingCrianca] = useState<Crianca | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredCriancas = useMemo(() => {
    let filtered = criancas;

    if (statusFilter !== "todos") {
      if (statusFilter === "Matriculado" || statusFilter === "Matriculada") {
        filtered = filtered.filter(c => c.status === "Matriculado" || c.status === "Matriculada");
      } else {
        filtered = filtered.filter(c => c.status === statusFilter);
      }
    }

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nome.toLowerCase().includes(lowerCaseSearch) ||
        c.responsavel.toLowerCase().includes(lowerCaseSearch)
      );
    }

    return filtered;
  }, [criancas, statusFilter, searchTerm]);

  const getStatusBadge = (status: Crianca['status']) => {
    const variants: Record<Crianca['status'], { variant: "default" | "secondary" | "outline", className: string, text: string }> = {
      "Matriculada": { variant: "default", className: "bg-secondary text-secondary-foreground", text: "Matriculada" },
      "Matriculado": { variant: "default", className: "bg-secondary text-secondary-foreground", text: "Matriculado" },
      "Fila de Espera": { variant: "secondary", className: "bg-accent/20 text-foreground", text: "Fila de Espera" },
      "Convocado": { variant: "default", className: "bg-primary/20 text-primary", text: "Convocado" },
      "Desistente": { variant: "default", className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { variant: "default", className: "bg-destructive/20 text-destructive", text: "Recusada" },
    };
    
    const config = variants[status] || { variant: "outline" as const, className: "", text: status };
    return <Badge variant={config.variant} className={config.className}>{config.text}</Badge>;
  };

  const handleEditClick = (crianca: Crianca) => {
    setEditingCrianca(crianca);
    setIsModalOpen(true);
  };

  const handleNewCriancaClick = () => {
    setEditingCrianca(undefined);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCrianca(undefined);
  };

  const handleDelete = async (id: number) => {
    await deleteCrianca(id);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crianças</h1>
            <p className="text-muted-foreground">Cadastro e gerenciamento de todas as crianças do sistema</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={handleNewCriancaClick}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Criança
              </Button>
            </DialogTrigger>
            <NovaCriancaModalContent 
              onClose={handleModalClose} 
              initialData={editingCrianca}
            />
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome da criança..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Matriculado">Matriculado/a</SelectItem>
                  <SelectItem value="Fila de Espera">Fila de Espera</SelectItem>
                  <SelectItem value="Convocado">Convocado</SelectItem>
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

        {filteredCriancas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma criança encontrada com os filtros aplicados.
            </CardContent>
          </Card>
        ) : currentView === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCriancas.map((crianca) => (
              <Card key={crianca.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{crianca.nome}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {crianca.idade}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data Nasc.:</span>
                    <span className="font-medium">{crianca.dataNascimento}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Responsável:</span>
                    <span className="font-medium">{crianca.responsavel}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(crianca.status)}
                  </div>
                  {crianca.cmei !== "N/A" && (
                    <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">{crianca.cmei}</span>
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/admin/criancas/${crianca.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditClick(crianca)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criança</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data Nasc.</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CMEI</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCriancas.map((crianca) => (
                    <TableRow key={crianca.id}>
                      <TableCell className="font-medium">{crianca.nome}</TableCell>
                      <TableCell>{crianca.responsavel}</TableCell>
                      <TableCell>{crianca.dataNascimento}</TableCell>
                      <TableCell>{crianca.idade}</TableCell>
                      <TableCell>{getStatusBadge(crianca.status)}</TableCell>
                      <TableCell>{crianca.cmei !== "N/A" ? crianca.cmei : "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/criancas/${crianca.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(crianca)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a criança 
                                    <span className="font-semibold"> {crianca.nome} </span>
                                    e todos os seus registros.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(crianca.id)} 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Excluindo..." : "Excluir"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Criancas;