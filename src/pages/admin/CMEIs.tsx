import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, Users, Edit, Eye, List, LayoutGrid, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NovaCmeiModal from "@/components/NovaCmeiModal";
import { useState } from "react";
import { toast } from "sonner"; // Importar toast do sonner
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Importar ToggleGroup
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Importar componentes de tabela
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importar DropdownMenu
import { Badge } from "@/components/ui/badge"; // Importar Badge

interface Cmei {
  id: number;
  nome: string;
  endereco: string;
  capacidade: number; // Mantido para exibição
  ocupacao: number;   // Mantido para exibição
  latitude?: string;  // Adicionado
  longitude?: string; // Adicionado
  telefone?: string;
  email?: string;
  diretor?: string;
  coordenador?: string;
  observacoes?: string;
}

const CMEIs = () => {
  const [cmeis, setCmeis] = useState<Cmei[]>([
    { id: 1, nome: "CMEI Centro", endereco: "Rua Central, 123", capacidade: 150, ocupacao: 142, latitude: "-23.5505", longitude: "-46.6333", telefone: "(44) 9 1234-5678", email: "centro@cmei.com.br", diretor: "Maria Silva", coordenador: "Ana Paula", observacoes: "CMEI com boa estrutura." },
    { id: 2, nome: "CMEI Norte", endereco: "Av. Norte, 456", capacidade: 120, ocupacao: 115, latitude: "-23.4500", longitude: "-46.5500", telefone: "(44) 9 8765-4321", email: "norte@cmei.com.br", diretor: "João Santos", coordenador: "Pedro Lima", observacoes: "Em expansão." },
    { id: 3, nome: "CMEI Sul", endereco: "Rua Sul, 789", capacidade: 180, ocupacao: 165, latitude: "-23.6500", longitude: "-46.7500", telefone: "(44) 9 1122-3344", email: "sul@cmei.com.br", diretor: "Carla Oliveira", coordenador: "Lucas Costa", observacoes: "Recém reformado." },
    { id: 4, nome: "CMEI Leste", endereco: "Av. Leste, 321", capacidade: 140, ocupacao: 128, latitude: "-23.5000", longitude: "-46.5000", telefone: "(44) 9 5566-7788", email: "leste@cmei.com.br", diretor: "Beatriz Souza", coordenador: "Gabriel Alves", observacoes: "Parceria com a comunidade." },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCmei, setEditingCmei] = useState<Omit<Cmei, 'capacidade' | 'ocupacao'> & { id?: number } | undefined>(undefined);
  const [isListView, setIsListView] = useState(false); // Estado para controlar a visualização

  const handleSaveCmei = (data: Omit<Cmei, 'id' | 'capacidade' | 'ocupacao'>) => {
    if (editingCmei?.id) {
      // Lógica para editar CMEI existente
      setCmeis(cmeis.map(c => c.id === editingCmei.id ? { ...c, ...data } : c));
      toast.success("CMEI atualizado com sucesso!");
    } else {
      // Lógica para adicionar novo CMEI
      const newId = Math.max(...cmeis.map(c => c.id)) + 1;
      // Para um novo CMEI, a ocupação e capacidade inicial podem ser 0 ou um valor padrão
      setCmeis([...cmeis, { id: newId, ocupacao: 0, capacidade: 0, ...data }]); 
      toast.success("CMEI cadastrado com sucesso!");
    }
    setEditingCmei(undefined);
    setIsModalOpen(false);
  };

  const handleEditClick = (cmei: Cmei) => {
    // Ao editar, passamos apenas os campos que o modal pode editar
    setEditingCmei({
      id: cmei.id,
      nome: cmei.nome,
      endereco: cmei.endereco,
      latitude: cmei.latitude,
      longitude: cmei.longitude,
      telefone: cmei.telefone,
      email: cmei.email,
      diretor: cmei.diretor,
      coordenador: cmei.coordenador,
    });
    setIsModalOpen(true);
  };

  const handleNewCmeiClick = () => {
    setEditingCmei(undefined); // Limpa os dados para um novo CMEI
    setIsModalOpen(true);
  };

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
              onSave={handleSaveCmei} 
              onClose={() => setIsModalOpen(false)} 
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
                />
              </div>
              <ToggleGroup 
                type="single" 
                defaultValue="grid" 
                onValueChange={(value) => setIsListView(value === "list")}
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

        {!isListView ? (
          <div className="grid md:grid-cols-2 gap-6">
            {cmeis.map((cmei) => {
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
        ) : (
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
                    <TableHead className="text-center">Ocupação (%)</TableHead> {/* Nova coluna para o badge */}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cmeis.map((cmei) => {
                    const ocupacaoPercent = cmei.capacidade > 0 ? Math.round((cmei.ocupacao / cmei.capacidade) * 100) : 0;
                    return (
                      <TableRow key={cmei.id}>
                        <TableCell className="font-medium">{cmei.nome}</TableCell>
                        <TableCell>{cmei.endereco}</TableCell>
                        <TableCell className="text-center">{cmei.capacidade}</TableCell>
                        <TableCell className="text-center">{cmei.ocupacao}</TableCell> {/* Apenas o número */}
                        <TableCell className="text-center">{cmei.capacidade - cmei.ocupacao}</TableCell> {/* Apenas o número */}
                        <TableCell className="text-center"> {/* Coluna para o badge */}
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