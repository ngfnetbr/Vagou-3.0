import { Card, CardContent } from "@/components/ui/card";

interface FilaStatsProps {
  totalFila: number;
  comPrioridade: number;
  convocados: number;
}

export const FilaStats = ({ totalFila, comPrioridade, convocados }: FilaStatsProps) => (
  <div className="grid md:grid-cols-3 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold text-foreground">{totalFila}</div>
        <p className="text-sm text-muted-foreground">Total na Fila</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold text-primary">{comPrioridade}</div>
        <p className="text-sm text-muted-foreground">Com Prioridade Social</p>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold text-secondary">{convocados}</div>
        <p className="text-sm text-muted-foreground">Crianças Convocadas</p>
      </CardContent>
    </Card>
  </div>
);