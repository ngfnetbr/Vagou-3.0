import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, ListOrdered, TrendingUp, Loader2, History, Clock } from "lucide-react";
import { useCriancas } from "@/hooks/use-criancas";
import { useHistoricoGeral } from "@/hooks/use-historico"; // Importando hook de histórico
import { useCmeisTotalCapacity } from "@/hooks/use-cmeis-total-capacity"; // Novo hook
import { useAverageWaitTime } from "@/hooks/use-average-wait-time"; // Novo hook
import { useMemo } from "react";
import { Crianca } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper para formatar dias em meses e dias
const formatDaysToTime = (days: number | null): string => {
    if (days === null || days <= 0) return "N/A";
    
    const totalDays = Math.round(days);
    const months = Math.floor(totalDays / 30.44); // Média de dias por mês
    const remainingDays = totalDays % 30;
    
    const parts = [];
    if (months > 0) parts.push(`${months} mês(es)`);
    if (remainingDays > 0 || months === 0) parts.push(`${remainingDays} dia(s)`);
    
    return parts.join(' e ');
};

const Dashboard = () => {
  const { criancas, isLoading: isLoadingCriancas } = useCriancas();
  const { data: capacidadeTotal, isLoading: isLoadingCapacidade } = useCmeisTotalCapacity();
  const { logs: historicoRecente, isLoading: isLoadingHistorico } = useHistoricoGeral();
  const { data: averageWaitTimeDays, isLoading: isLoadingWaitTime } = useAverageWaitTime(); // Novo hook
  
  const { totalCriancas, matriculasAtivas, filaEspera, convocacoesPendentes, taxaOcupacao } = useMemo(() => {
    if (!criancas || criancas.length === 0) {
      return {
        totalCriancas: 0,
        matriculasAtivas: 0,
        filaEspera: 0,
        convocacoesPendentes: [],
        taxaOcupacao: "0%",
      };
    }

    const totalCriancas = criancas.length;
    const matriculasAtivas = criancas.filter(c => c.status === "Matriculado" || c.status === "Matriculada").length;
    const filaEspera = criancas.filter(c => c.status === "Fila de Espera").length;
    const convocacoesPendentes = criancas.filter(c => c.status === "Convocado");
    
    const totalCapacity = capacidadeTotal ?? 0;
    
    let taxaOcupacao = "0%";
    if (totalCapacity > 0) {
        const ocupacao = Math.round((matriculasAtivas / totalCapacity) * 100);
        taxaOcupacao = `${ocupacao}%`;
    }
    
    return {
      totalCriancas,
      matriculasAtivas,
      filaEspera,
      convocacoesPendentes,
      taxaOcupacao,
    };
  }, [criancas, capacidadeTotal]);
  
  const formattedWaitTime = formatDaysToTime(averageWaitTimeDays);
  
  const stats = [
    {
      title: "Total de Crianças",
      value: totalCriancas.toLocaleString('pt-BR'),
      icon: Users,
      description: "Cadastradas no sistema",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Matrículas Ativas",
      value: matriculasAtivas.toLocaleString('pt-BR'),
      icon: GraduationCap,
      description: "Alunos matriculados",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Fila de Espera",
      value: filaEspera.toLocaleString('pt-BR'),
      icon: ListOrdered,
      description: "Aguardando vaga",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Taxa de Ocupação",
      value: taxaOcupacao,
      icon: TrendingUp,
      description: "Capacidade utilizada",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Média Tempo de Espera",
      value: formattedWaitTime,
      icon: Clock,
      description: "Tempo médio até a convocação",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];
  
  if (isLoadingCriancas || isLoadingHistorico || isLoadingCapacidade || isLoadingWaitTime) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Carregando dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão de vagas</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Convocações Pendentes ({convocacoesPendentes.length})</CardTitle>
                <CardDescription>Convocações aguardando confirmação ou prazo expirado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {convocacoesPendentes.slice(0, 5).map((crianca) => (
                    <div key={crianca.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{crianca.nome}</p>
                        <p className="text-sm text-muted-foreground">{crianca.cmeiNome} ({crianca.turmaNome})</p>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Pendente
                      </span>
                    </div>
                  ))}
                  {convocacoesPendentes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma convocação pendente.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Atividades Recentes
                </CardTitle>
                <CardDescription>Últimas ações registradas no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historicoRecente.slice(0, 5).map((atividade, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{atividade.acao}</p>
                        <p className="text-sm text-muted-foreground">{atividade.detalhes}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(parseISO(atividade.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                  {historicoRecente.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;