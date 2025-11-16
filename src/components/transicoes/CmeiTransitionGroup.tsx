import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, RotateCcw, Trash2, ArrowRight, CheckCircle, Users, ListOrdered, CheckSquare } from "lucide-react";
import { CriancaClassificada, StatusTransicao } from "@/hooks/use-transicoes";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type JustificativaAction = 'desistente' | 'concluinte';

interface CmeiTransitionGroupProps {
    cmeiName: string;
    turmaGroups: { [turmaName: string]: CriancaClassificada[] }; // Novo prop
    // isSaving removido
    isExecuting: boolean;
    selectedIds: string[];
    toggleSelection: (id: string) => void;
    handleRealocacaoIndividualClick: (crianca: CriancaClassificada) => void;
    handleStatusIndividualClick: (crianca: CriancaClassificada, action: JustificativaAction) => void;
}

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
    return <Badge className={cn("w-fit", config.className)}>{config.text}</Badge>;
};

export const CmeiTransitionGroup = ({
    cmeiName,
    turmaGroups,
    // isSaving removido
    isExecuting,
    selectedIds,
    toggleSelection,
    handleRealocacaoIndividualClick,
    handleStatusIndividualClick,
}: CmeiTransitionGroupProps) => {
    const navigate = useNavigate();
    
    // Função para selecionar/desselecionar todas as crianças de uma turma
    const toggleSelectAllTurma = (criancasList: CriancaClassificada[]) => {
        const turmaIds = criancasList.map(c => c.id);
        const allSelected = turmaIds.every(id => selectedIds.includes(id));
        
        if (allSelected) {
            // Se todos estão selecionados, desmarca um por um
            turmaIds.forEach(id => {
                if (selectedIds.includes(id)) {
                    toggleSelection(id);
                }
            });
            
        } else {
            // Selecionar todos
            turmaIds.forEach(id => {
                if (!selectedIds.includes(id)) {
                    toggleSelection(id);
                }
            });
        }
    };
    
    // Função para obter o nome da vaga planejada (se houver mudança)
    const getPlannedVaga = (crianca: CriancaClassificada) => {
        // Se houver planejamento de vaga
        if (crianca.planned_cmei_nome && crianca.planned_turma_nome) {
            return (
                <Badge variant="secondary" className="bg-primary/10 text-primary font-normal">
                    {crianca.planned_cmei_nome} - {crianca.planned_turma_nome}
                </Badge>
            );
        }
        
        return null;
    };
    
    // Função para obter o status planejado (se houver mudança)
    const getPlannedStatus = (crianca: CriancaClassificada) => {
        // Se houver um status planejado, exibe-o
        if (crianca.planned_status) {
            // Se for uma realocação de Saída Final, o status planejado é Convocado
            if (crianca.planned_status === 'Convocado') {
                return getStatusBadge('Convocado');
            }
            
            // Caso contrário, exibe o status de saída planejado (Desistente/Recusada)
            return getStatusBadge(crianca.planned_status);
        }
        
        // Se não houver status planejado, exibe "Não Planejado"
        return (
            <span className="text-xs text-muted-foreground italic">
                Não Planejado
            </span>
        );
    };

    return (
        <Accordion type="multiple" className="w-full space-y-2 p-4">
            {Object.entries(turmaGroups).map(([turmaName, criancasList]) => {
                
                const turmaIds = criancasList.map(c => c.id);
                const allSelected = turmaIds.length > 0 && turmaIds.every(id => selectedIds.includes(id));
                const someSelected = turmaIds.some(id => selectedIds.includes(id)) && !allSelected;
                
                return (
                <AccordionItem key={turmaName} value={turmaName} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                                <ListOrdered className="h-5 w-5 text-secondary" />
                                <span className="font-semibold text-base">{turmaName}</span>
                                <Badge variant="outline" className="ml-2">{criancasList.length} crianças</Badge>
                            </div>
                            
                            {/* Botão Selecionar Todos por Turma */}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                    e.stopPropagation(); // Previne que o accordion feche
                                    toggleSelectAllTurma(criancasList);
                                }}
                                disabled={isExecuting || criancasList.length === 0}
                                className={cn(
                                    "text-xs h-7",
                                    allSelected && "bg-primary/10 text-primary border-primary/50",
                                    someSelected && "bg-primary/5 text-primary border-primary/30"
                                )}
                            >
                                <CheckSquare className="mr-2 h-3 w-3" />
                                {allSelected ? "Desmarcar Todos" : "Selecionar Todos"}
                            </Button>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-12">Sel.</TableHead>
                                    <TableHead>Criança</TableHead>
                                    <TableHead>Status Atual</TableHead>
                                    <TableHead>Status Planejado</TableHead>
                                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {criancasList.map(c => {
                                    const isSelected = selectedIds.includes(c.id);
                                    // A criança tem uma mudança planejada se planned_status for definido OU se a vaga planejada for diferente da atual
                                    const hasPlannedChange = !!c.planned_status || !!c.planned_cmei_id || !!c.planned_turma_id;
                                    
                                    // Determina se as ações de Realocação e Conclusão devem ser exibidas
                                    // Realocação: Permitida para Remanejamento Interno E Fila Reclassificada
                                    const showRealocacao = c.statusTransicao === 'Remanejamento Interno' || c.statusTransicao === 'Fila Reclassificada';
                                    
                                    // Conclusão/Desistência: Permitida para Remanejamento Interno
                                    const showConclusao = c.statusTransicao === 'Remanejamento Interno';
                                    
                                    return (
                                    <TableRow key={c.id} className={cn(hasPlannedChange && "bg-yellow-50/50 hover:bg-yellow-50/70", isSelected && "bg-primary/10 hover:bg-primary/15")}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelection(c.id)}
                                                disabled={isExecuting}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{c.nome}</div>
                                            <div className="text-xs text-muted-foreground">{c.idade}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 items-start">
                                                {getStatusBadge(c.status)}
                                                {(c.cmeiNome || c.turmaNome) && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {c.cmeiNome} - {c.turmaNome}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 items-start">
                                                {getPlannedStatus(c)}
                                                {getPlannedVaga(c)}
                                            </div>
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
                                                    
                                                    {/* Ação de Realocação */}
                                                    {showRealocacao && (
                                                        <DropdownMenuItem 
                                                            onClick={() => handleRealocacaoIndividualClick(c)}
                                                        >
                                                            <RotateCcw className="mr-2 h-4 w-4" />
                                                            Realocar Vaga
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    {/* Marcar Conclusão de Ciclo */}
                                                    {showConclusao && (
                                                        <DropdownMenuItem 
                                                            onClick={() => handleStatusIndividualClick(c, 'concluinte')}
                                                            className="text-secondary focus:bg-secondary/10 focus:text-secondary"
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Marcar Conclusão de Ciclo
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    {/* Marcar Desistente */}
                                                    {showConclusao && (
                                                        <DropdownMenuItem 
                                                            onClick={() => handleStatusIndividualClick(c, 'desistente')}
                                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Marcar Desistente
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            );
            })}
        </Accordion>
    );
};