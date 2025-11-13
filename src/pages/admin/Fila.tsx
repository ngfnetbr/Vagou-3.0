import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Bell, XCircle, Eye, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useCriancas } from "@/hooks/use-criancas";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crianca } from "@/lib/mock-data";

const Fila = () => {
  const { criancas, isLoading } = useCriancas();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cmeiFilter, setCmeiFilter] = useState("todos");
  const [prioridadeFilter, setPrioridadeFilter] = useState("todas");

  const filteredFila = useMemo(() => {
    if (!criancas) return [];

    let filtered = criancas.filter(c => c.status === "Fila de Espera");

    // 1. Apply CMEI filter (based on cmei1 preference)
    if (cmeiFilter !== "todos") {
      filtered = filtered.filter(c => c.cmei1 === cmeiFilter);
    }

    // 2. Apply Priority filter
    if (prioridadeFilter === "prioridade") {
      filtered = filtered.filter(c => c.programasSociais === "sim");
    } else if (prioridadeFilter === "normal") {
      filtered = filtered.filter(c => c.programasSociais === "nao");
    }
    
    // 3. Apply Search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nomeCrianca.toLowerCase().includes(lowerCaseSearch) ||
        c.nomeResponsavel.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 4. Sort the list (by priority then by inscription date/dataNascimento)
    filtered.sort((a, b) => {
        // Priority sort: 'sim' comes before 'nao'
        if (a.programasSociais === 'sim' && b.programasSociais === 'nao') return -1;
        if (a.programasSociais === 'nao' && b.programasSociais === 'sim') return 1;
        
        // Secondary sort: Oldest child first (using dataNascimento for stable sorting)
        return new Date(a.dataNascimento).getTime() - new Date(b.dataNascimento).getTime();
    });

    // 5. Assign dynamic position
    return filtered.map((c, index) => ({
        ...c,
        posicaoFila: index + 1,
    }));

  }, [criancas, cmeiFilter, prioridadeFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalFila = criancas.filter(c => c.status === "Fila de Espera").length;
    const comPrioridade = criancas.filter(c => c.status === "Fila de Espera" && c.programasSociais === "sim").length;
    const convocados = criancas.filter(c => c.status === "Convocado").length;

    return { totalFila, comPrioridade, convocados };
  }, [criancas]);

  const getPriorityLabel = (crianca: Crianca) => {
    if (crianca.programasSociais === "sim") {
      return "Prioridade Social";
    }
    // Mocking other priorities based on cmei2 presence or just default
    if (crianca.cmei2) return "Múltipla Opção";
    return "Normal";
  };

  const getInscriptionDate = (crianca: Crianca) => {
    const inscriptionEntry = crianca.historico.find(h => h.acao.includes("Inscrição Inicial"));
    if (inscriptionEntry) {
      try {
        return format(new Date(inscriptionEntry.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
      } catch (e) {
        return 'N/A';
      }
    }
    return 'N/A';
  };

  const handleConvocar = (crianca: Crianca) => {
    toast.info(`Convocando ${crianca.nomeCrianca}...`, {
      description: `Notificação de matrícula será enviada para ${crianca.cmei1}. (Ação mockada)`,
    });
  };

  const handleDesistente = (crianca: Crianca) => {
    toast.warning(`Marcando ${crianca.nomeCrianca} como desistente. (Ação mockada)`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando fila de espera...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Fila de Espera</h1>
            <p className="text-muted-foreground">Gerenciamento da fila de espera para vagas</p>
          </div>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar Fila
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{stats.totalFila}</div>
              <p className="text-sm text-muted-foreground">Total na Fila</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.comPrioridade}</div>
              <p className="text-sm text-muted-foreground">Com Prioridade Social</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-secondary">{stats.convocados}</div>
              <p className="text-sm text-muted-foreground">Crianças Convocadas</p>
            </CardContent>
          </Card>
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
                <Select onValueChange={setPrioridadeFilter} value={prioridadeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="prioridade">Com Prioridade Social</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Posição</TableHead>
                  <TableHead>Criança</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>CMEI Preferência</TableHead>
                  <TableHead>Data Insc.</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFila.length > 0 ? (
                  filteredFila.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-primary">#{item.posicaoFila}</TableCell>
                      <TableCell className="font-medium">{item.nomeCrianca}</TableCell>
                      <TableCell>{item.nomeResponsavel}</TableCell>
                      <TableCell>{item.cmei1}</TableCell>
                      <TableCell>{getInscriptionDate(item)}</TableCell>
                      <TableCell>
                        <Badge variant={item.programasSociais === "sim" ? "default" : "secondary"}>
                          {getPriorityLabel(item)}
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
                            <DropdownMenuItem onClick={() => navigate(`/admin/criancas/${item.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-secondary" onClick={() => handleConvocar(item)}>
                              <Bell className="mr-2 h-4 w-4" />
                              Convocar para matrícula
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDesistente(item)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Marcar como desistente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            Nenhuma criança na fila de espera com os filtros aplicados.
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

export default Fila;