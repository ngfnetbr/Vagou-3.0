import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface LogEntry {
  id: number;
  timestamp: string;
  usuario: string;
  acao: string;
  detalhes: string;
  tipo: "success" | "info" | "warning" | "error";
}

const mockLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: "07/11/2025 14:32:15",
    usuario: "admin@cidade.gov.br",
    acao: "Matrícula criada",
    detalhes: "Nova matrícula: Ana Silva Santos - CMEI Centro",
    tipo: "success"
  },
  {
    id: 2,
    timestamp: "07/11/2025 14:15:42",
    usuario: "gestor@cmei-norte.gov.br",
    acao: "Convocação enviada",
    detalhes: "Convocação enviada para Carlos Eduardo Silva",
    tipo: "info"
  },
  {
    id: 3,
    timestamp: "07/11/2025 13:58:20",
    usuario: "admin@cidade.gov.br",
    acao: "CMEI atualizado",
    detalhes: "Capacidade do CMEI Sul alterada de 180 para 200",
    tipo: "warning"
  },
  {
    id: 4,
    timestamp: "07/11/2025 13:45:10",
    usuario: "sistema",
    acao: "Backup automático",
    detalhes: "Backup diário realizado com sucesso",
    tipo: "success"
  },
  {
    id: 5,
    timestamp: "07/11/2025 12:30:05",
    usuario: "gestor@cmei-leste.gov.br",
    acao: "Transferência aprovada",
    detalhes: "Transferência de Lucas Oliveira de CMEI Norte para CMEI Leste",
    tipo: "info"
  },
  {
    id: 6,
    timestamp: "07/11/2025 11:20:33",
    usuario: "admin@cidade.gov.br",
    acao: "Usuário criado",
    detalhes: "Novo gestor cadastrado: gestor@cmei-oeste.gov.br",
    tipo: "success"
  },
  {
    id: 7,
    timestamp: "07/11/2025 10:15:22",
    usuario: "admin@cidade.gov.br",
    acao: "Importação de dados",
    detalhes: "45 crianças importadas via planilha",
    tipo: "success"
  },
  {
    id: 8,
    timestamp: "07/11/2025 09:05:11",
    usuario: "sistema",
    acao: "Tentativa de login falha",
    detalhes: "Tentativa de login com credenciais inválidas",
    tipo: "error"
  },
  {
    id: 9,
    timestamp: "07/11/2025 08:00:00",
    usuario: "admin@cidade.gov.br",
    acao: "Configuração alterada",
    detalhes: "Prazo de resposta de convocação alterado para 5 dias",
    tipo: "warning"
  },
];

const Logs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAcao, setFilterAcao] = useState("todas");
  const [filterTipo, setFilterTipo] = useState("todos");

  const getTipoBadge = (tipo: LogEntry['tipo']) => {
    const variants: Record<LogEntry['tipo'], { className: string, label: string }> = {
      "success": { className: "bg-secondary/20 text-secondary", label: "Sucesso" },
      "info": { className: "bg-primary/20 text-primary", label: "Info" },
      "warning": { className: "bg-accent/20 text-foreground", label: "Alerta" },
      "error": { className: "bg-destructive/20 text-destructive", label: "Erro" },
    };
    
    const config = variants[tipo] || { className: "", label: tipo };
    
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredLogs = useMemo(() => {
    return mockLogs.filter(log => {
      // 1. Filtrar por termo de busca
      const matchesSearch = searchTerm.toLowerCase() === "" ||
        log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detalhes.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filtrar por tipo de log (success, info, warning, error)
      const matchesTipo = filterTipo === "todos" || log.tipo === filterTipo;
      
      if (!matchesTipo) return false;

      // 3. Filtrar por tipo de ação (mais genérico, baseado na ação)
      if (filterAcao === "todas") return true;

      if (filterAcao === "matricula" && log.acao.toLowerCase().includes("matrícula")) return true;
      if (filterAcao === "convocacao" && log.acao.toLowerCase().includes("convocação")) return true;
      if (filterAcao === "usuario" && log.acao.toLowerCase().includes("usuário")) return true;
      if (filterAcao === "cmei" && log.acao.toLowerCase().includes("cmei")) return true;
      if (filterAcao === "sistema" && log.usuario.toLowerCase() === "sistema") return true;
      
      return false;
    });
  }, [searchTerm, filterAcao, filterTipo]);

  const handleExport = () => {
    toast.success("Exportação de logs iniciada!", {
      description: "O arquivo de logs será gerado e baixado em breve.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Logs do Sistema</h1>
            <p className="text-muted-foreground">Histórico detalhado de todas as ações no sistema</p>
          </div>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Logs
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar nos logs..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select onValueChange={setFilterAcao} value={filterAcao}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as ações</SelectItem>
                    <SelectItem value="matricula">Matrículas</SelectItem>
                    <SelectItem value="convocacao">Convocações</SelectItem>
                    <SelectItem value="usuario">Usuários</SelectItem>
                    <SelectItem value="cmei">CMEIs</SelectItem>
                    <SelectItem value="sistema">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={setFilterTipo} value={filterTipo}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Alerta</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell className="text-sm">{log.usuario}</TableCell>
                      <TableCell className="font-medium">{log.acao}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {log.detalhes}
                      </TableCell>
                      <TableCell>{getTipoBadge(log.tipo)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum log encontrado com os filtros aplicados.
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

export default Logs;