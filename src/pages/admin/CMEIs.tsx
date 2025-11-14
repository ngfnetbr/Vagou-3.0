import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, Users, Edit, Eye, List, LayoutGrid, MoreVertical, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaCmeiModal from "@/components/NovaCmeiModal";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCMEIs, Cmei } from "@/hooks/use-cmeis"; // Importar hook e tipagem

const CMEIs = () => {
  const { cmeis, isLoading, error } = useCMEIs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCmei, setEditingCmei] = useState<Cmei | undefined>(undefined);
  const [currentView, setCurrentView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const handleEditClick = (cmei: Cmei) => {
    // Mapeia Cmei (com capacidade/ocupacao) para o formato esperado pelo modal (sem esses campos)
    setEditingCmei(cmei);
    setIsModalOpen(true);
  };

  const handleNewCmeiClick = () => {
    setEditingCmei(undefined);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCmei(undefined);
  };

  const filteredCmeis = cmeis.filter(cmei => 
    cmei.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmei.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando CMEIs...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="text-center p-8 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-semibold">Erro ao carregar dados: {error.message}</p>
          <p className="text-sm text-destructive/80 mt-2">Verifique a conexão com o Supabase e as políticas de RLS.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CMEIs</h1>
            <p className="text-muted-foreground">Gerenciamento dos Centros Municipais de Educação Infantil</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={handleNewCmeiClick}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo CMEI
              </Button>
            </DialogTrigger>
            <NovaCmeiModal 
              initialData={editingCmei} 
              onClose={handleModalClose} 
            />
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou endereço..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
        
        {filteredCmeis.length === 0 && (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum CMEI encontrado.
                </CardContent>
            </Card>
        )}

        {currentView === "grid" && filteredCmeis.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCmeis.map((cmei) => {
              const ocupacaoPercent = cmei.capacidade > 0 ? Math.round((cmei.ocupacao / cmei.capacidade) * 100) : 0;
              return (
                <Card key={cmei.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{cmei.nome}</span>
                      <span className={`text-sm font-normal px-2 py-1 rounded ${
                        ocupacaoPercent >= 90 
                          ? 'bg-destructive/20 text-destructive' 
                          : 'bg-secondary/20 text-secondary'
                      }`}>
                        {ocupacaoPercent}% ocupado
                      </span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {cmei.endereco}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Capacidade</span>
                      </div>
                      <span className="font-semibold">{cmei.capacidade} vagas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ocupadas</span>
                      <span className="font-semibold text-primary">{cmei.ocupacao} alunos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Disponíveis</span>
                      <span className="font-semibold text-secondary">{cmei.capacidade - cmei.ocupacao} vagas</span>
                    </div>
                    <div className="pt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(cmei)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Link to={`/admin/turmas?cmei=${encodeURIComponent(cmei.nome)}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Turmas
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {currentView === "list" && filteredCmeis.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do CMEI</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-center">Capacidade</TableHead>
                    <TableHead className="text-center">Vagas Ocupadas</TableHead>
                    <TableHead className="text-center">Vagas Disponíveis</TableHead>
                    <TableHead className="text-center">Ocupação (%)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCmeis.map((cmei) => {
                    const ocupacaoPercent = cmei.capacidade > 0 ? Math.round((cmei.ocupacao / cmei.capacidade) * 100) : 0;
                    return (
                      <TableRow key={cmei.id}>
                        <TableCell className="font-medium">{cmei.nome}</TableCell>
                        <TableCell>{cmei.endereco}</TableCell>
                        <TableCell className="text-center">{cmei.capacidade}</TableCell>
                        <TableCell className="text-center">{cmei.ocupacao}</TableCell>
                        <TableCell className="text-center">{cmei.capacidade - cmei.ocupacao}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs font-normal ${
                            ocupacaoPercent >= 90 
                              ? 'bg-destructive/20 text-destructive' 
                              : 'bg-secondary/20 text-secondary'
                          }`}>
                            {ocupacaoPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(cmei)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <Link to={`/admin/turmas?cmei=${encodeURIComponent(cmei.nome)}`}>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Turmas
                                </DropdownMenuItem>
                              </Link>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default CMEIs;