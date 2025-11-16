import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, RotateCcw, Trash2, ArrowRight, CheckCircle, Users } from "lucide-react";
import { CriancaClassificada, StatusTransicao } from "@/hooks/use-transicoes";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type JustificativaAction = 'desistente' | 'concluinte';

interface CmeiTransitionGroupProps {
    cmeiName: string;
    turmaGroups: { [turmaName: string]: CriancaClassificada[] }; // Novo prop
    isSaving: boolean;
    isExecuting: boolean;
    selectedIds: string[];
    toggleSelection: (id: string) => void;
    handleRealocacaoIndividualClick: (crianca: CriancaClassificada) => void;
    handleStatusIndividualClick: (crianca: CriancaClassificada, action: JustificativaAction) => void;
}

export const CmeiTransitionGroup = ({
    cmeiName,
    turmaGroups,
    isSaving,
    isExecuting,
    selectedIds,
    toggleSelection,
    handleRealocacaoIndividualClick,
    handleStatusIndividualClick,
}: CmeiTransitionGroupProps) => {
    const navigate = useNavigate();
    
    // Calcula o total de crianças no CMEI
    const totalCriancas = Object.values(turmaGroups).flat().length;
    const totalMatriculados = Object.entries(turmaGroups)
        .filter(([turmaName]) => turmaName !== 'Fila de Espera')
        .map(([, criancas]) => criancas.length)
        .reduce((sum, count) => sum + count, 0);
    
    const totalFila = turmaGroups['Fila de Espera']?.length || 0;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl">{cmeiName}</CardTitle>
                <CardDescription>
                    {totalMatriculados} alunos ativos e {totalFila} na fila de espera.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
                
                {Object.entries(turmaGroups).map(([turmaName, criancasList]) => (
                    <div key={turmaName} className="mb-4">
                        <div className="flex items-center gap-2 p-3 bg-muted/50 border-b border-t border-border">
                            <Users className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground">
                                {turmaName} ({criancasList.length} crianças)
                            </h3>
                        </div>
                        
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Sel.</TableHead>
                                    <TableHead>Criança</TableHead>
                                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {criancasList.map(c => {
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
                                            <div className="text-xs text-muted-foreground">Próxima Turma Base: <Badge variant="secondary" className="text-xs">{c.turmaBaseProximoAno}</Badge></div>
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
                                                    
                                                    {/* Marcar Concluinte (Evasão) */}
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusIndividualClick(c, 'concluinte')}
                                                        className="text-secondary focus:bg-secondary/10 focus:text-secondary"
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marcar Concluinte
                                                    </DropdownMenuItem>
                                                    
                                                    {/* Marcar Desistente */}
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusIndividualClick(c, 'desistente')}
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Marcar Desistente
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};