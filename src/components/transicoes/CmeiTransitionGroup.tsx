import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, RotateCcw, Trash2, ArrowRight } from "lucide-react";
import { CriancaClassificada, StatusTransicao } from "@/hooks/use-transicoes";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

type JustificativaAction = 'desistente' | 'transferir';

interface CmeiTransitionGroupProps {
    cmeiName: string;
    criancas: CriancaClassificada[];
    updatePlanning: (criancaId: string, newStatus: StatusTransicao) => void;
    isSaving: boolean;
    isExecuting: boolean;
    selectedIds: string[];
    toggleSelection: (id: string) => void;
    handleRealocacaoIndividualClick: (crianca: CriancaClassificada) => void;
    handleStatusIndividualClick: (crianca: CriancaClassificada, action: JustificativaAction) => void;
}

const statusOptions: { value: StatusTransicao, label: string }[] = [
    { value: 'Remanejamento Interno', label: 'Remanejamento Interno' },
    { value: 'Fila Reclassificada', label: 'Fila Reclassificada' },
    { value: 'Concluinte', label: 'Concluinte (Evasão)' },
    { value: 'Manter Status', label: 'Manter Status Atual' },
];

const getStatusBadge = (status: CriancaClassificada['status']) => {
    const variants: Record<CriancaClassificada['status'], { className: string, text: string }> = {
      "Matriculada": { className: "bg-secondary/20 text-secondary", text: "Matriculada" },
      "Matriculado": { className: "bg-secondary/20 text-secondary", text: "Matriculado" },
      "Fila de Espera": { className: "bg-accent/20 text-foreground", text: "Fila de Espera" },
      "Convocado": { className: "bg-primary/20 text-primary", text: "Convocado" },
      "Desistente": { className: "bg-destructive/20 text-destructive", text: "Desistente" },
      "Recusada": { className: "bg-destructive/20 text-destructive", text: "Recusada" },
      "Remanejamento Solicitado": { className: "bg-accent/20 text-foreground", text: "Remanejamento Solicitado" },
    };
    
    const config = variants[status] || { className: "bg-muted text-muted-foreground", text: status };
    return <Badge className={`text-xs ${config.className}`}>{config.text}</Badge>;
};

export const CmeiTransitionGroup = ({
    cmeiName,
    criancas,
    updatePlanning,
    isSaving,
    isExecuting,
    selectedIds,
    toggleSelection,
    handleRealocacaoIndividualClick,
    handleStatusIndividualClick,
}: CmeiTransitionGroupProps) => {
    const navigate = useNavigate();
    
    // Separa crianças matriculadas/convocadas (que têm CMEI atual) das que estão apenas na fila
    const matriculados = criancas.filter(c => c.cmei_atual_id);
    const fila = criancas.filter(c => !c.cmei_atual_id);
    
    // Combina e ordena para exibição (Matriculados primeiro)
    const sortedCriancas = [...matriculados, ...fila];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl">{cmeiName}</CardTitle>
                <CardDescription>
                    {matriculados.length} alunos ativos e {fila.length} na fila de espera.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-12">Sel.</TableHead>
                            <TableHead>Criança</TableHead>
                            <TableHead>Turma Atual</TableHead>
                            <TableHead>Próxima Turma Base</TableHead>
                            <TableHead className="w-[180px]">Ação Planejada</TableHead>
                            <TableHead className="text-right w-[80px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedCriancas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                                    Nenhuma criança neste CMEI para transição.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedCriancas.map(c => {
                                const isMatriculado = c.status === 'Matriculado' || c.status === 'Matriculada' || c.status === 'Convocado';
                                
                                return (
                                <TableRow key={c.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(c.id)}
                                            onCheckedChange={() => toggleSelection(c.id)}
                                            disabled={isExecuting || isSaving}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{c.nome}</div>
                                        <div className="text-xs text-muted-foreground">{c.idade}</div>
                                    </TableCell>
                                    <TableCell>
                                        {isMatriculado && c.turmaNome ? (
                                            <div className="text-sm font-medium">{c.turmaNome}</div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">Fila</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-xs">{c.turmaBaseProximoAno}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            value={c.statusTransicao} 
                                            onValueChange={(value: StatusTransicao) => updatePlanning(c.id, value)}
                                            disabled={isExecuting || isSaving}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Ajustar Ação" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/admin/criancas/${c.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Detalhes
                                                </DropdownMenuItem>
                                                
                                                {/* Ação de Realocação (Mover para nova turma) */}
                                                <DropdownMenuItem 
                                                    onClick={() => handleRealocacaoIndividualClick(c)}
                                                    disabled={!isMatriculado} // Só permite realocar se estiver matriculado/convocado
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Realocar Vaga
                                                </DropdownMenuItem>
                                                
                                                {/* Ações de Status (Desistente/Transferir) */}
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusIndividualClick(c, 'desistente')}
                                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Marcar Desistente
                                                </DropdownMenuItem>
                                                
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusIndividualClick(c, 'transferir')}
                                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                >
                                                    <ArrowRight className="mr-2 h-4 w-4" />
                                                    Transferir (Sair)
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};