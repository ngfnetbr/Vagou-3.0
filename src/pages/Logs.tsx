import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useHistoricoGeral } from "@/hooks/use-historico"; // Importando o novo hook
import { HistoricoEntry } from "@/integrations/supabase/criancas"; // Importando a tipagem do novo local
import { Button } from "@/components/ui/button"; // Importação adicionada

// Tipagem local para Logs (usando HistoricoEntry)
interface LogEntry extends HistoricoEntry {
  id: number; // Mantendo id para key, embora o DB use bigint/UUID
  timestamp: string; // Usaremos created_at para isso
  tipo: "success" | "info" | "warning" | "error"; // Tipo inferido da ação
}

const Logs = () => {
  const { logs: rawLogs, isLoading, error } = useHistoricoGeral();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAcao, setFilterAcao] = useState("todas");
  const [filterTipo, setFilterTipo] = useState("todos");

  // Mapeia logs do DB para o formato de exibição e infere o tipo
  const mappedLogs: LogEntry[] = useMemo(() => {
    return rawLogs.map((log, index) => {
      let tipo: LogEntry['tipo'] = "info";
      if (log.acao.includes("Confirmada") || log.acao.includes("Matrícula") || log.acao.includes("Cadastrada") || log.acao.includes("Reativação")) {
        tipo = "success";
      } else if (log.acao.includes("Recusada") || log.acao.includes("Desistência") || log.acao.includes("Transferência") || log.acao.includes("Excluída")) {
        tipo = "error";
      } else if (log.acao.includes("Atualizados") || log.acao.includes("Remanejamento") || log.acao.includes("Fim de Fila")) {
        tipo = "warning";
      }
      
      return {
        ...log,
        id: index, // Usando index como fallback para key
        timestamp: new Date(log.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        tipo: tipo,
      };
    });
  }, [rawLogs]);

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
    return mappedLogs.filter(log => {
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

      if (filterAcao === "matricula" && (log.acao.toLowerCase().includes("matrícula") || log.acao.toLowerCase().includes("realocação"))) return true;
      if (filterAcao === "convocacao" && log.acao.toLowerCase().includes("convocação")) return true;
      if (filterAcao === "cadastro" && log.acao.toLowerCase().includes("inscrição")) return true;
      if (filterAcao === "status" && (log.acao.toLowerCase().includes("desistência") || log.acao.toLowerCase().includes("recusada") || log.acao.toLowerCase().includes("reativação"))) return true;
      if (filterAcao === "sistema" && log.usuario.toLowerCase() === "sistema") return true;
      
      return false;
    });
  }, [searchTerm, filterAcao, filterTipo, mappedLogs]);

  const handleExport = () => {
    toast.success("Exportação de logs iniciada!", {
      description: "O arquivo de logs será gerado e baixado em breve.",
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando logs do sistema...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="text-center p-8 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-semibold">Erro ao carregar logs: {error.message}</p>
          <p className="text-sm text-destructive/80 mt-2">Verifique a conexão com o Supabase e as políticas de RLS da tabela 'historico'.</p>
        </div>
      </AdminLayout>
    );
  }

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
                    <SelectItem value="cadastro">Inscrição/Cadastro</SelectItem>
                    <SelectItem value="matricula">Matrículas/Realocação</SelectItem>
                    <SelectItem value="convocacao">Convocações</SelectItem>
                    <SelectItem value="status">Status/Desistência</SelectItem>
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