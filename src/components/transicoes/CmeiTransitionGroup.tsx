import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, RotateCcw, Trash2, ArrowRight, CheckCircle, Users, ListOrdered } from "lucide-react";
import { CriancaClassificada, StatusTransicao } from "@/hooks/use-transicoes";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
    isSaving,
    isExecuting,
    selectedIds,
    toggleSelection,
    handleRealocacaoIndividualClick,
    handleStatusIndividualClick,
}: CmeiTransitionGroupProps) => {
    const navigate = useNavigate();
    
    // Função para obter o nome da vaga planejada (se houver mudança)
    const getPlannedVaga = (crianca: CriancaClassificada) => {
        const isVagaChanged = crianca.planned_cmei_id !== crianca.cmei_atual_id || crianca.planned_turma_id !== crianca.turma_atual_id;
        
        if (isVagaChanged && crianca.planned_cmei_nome && crianca.planned_turma_nome) {
            return (
                <Badge variant="secondary" className="bg-primary/10 text-primary font-normal">
                    {crianca.planned_cmei_nome} - {crianca.planned_turma_nome}
                </Badge>
            );
        }
        
        // Se não houver mudança, exibe a vaga atual (se houver)
        if (crianca.cmeiNome && crianca.turmaNome) {
            return (
                <span className="text-xs text-muted-foreground">
                    {crianca.cmeiNome} - {crianca.turmaNome}
                </span>
            );
        }
        
        return null;
    };
    
    // Função para obter o status planejado (se houver mudança)
    const getPlannedStatus = (crianca: CriancaClassificada) => {
        if (crianca.planned_status && crianca.planned_status !== crianca.status) {
            return getStatusBadge(crianca.planned_status);
        }
        return getStatusBadge(crianca.status);
    };

    return (
        <Accordion type="multiple" className="w-full space-y-2 p-4">
            {Object.entries(turmaGroups).map(([turmaName, criancasList]) => (
                <AccordionItem key={turmaName} value={turmaName} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <ListOrdered className="h-5 w-5 text-secondary" />
                            <span className="font-semibold text-base">{turmaName}</span>
                            <Badge variant="outline" className="ml-2">{criancasList.length} crianças</Badge>
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
                                    const hasPlannedChange = c.planned_status !== c.status || c.planned_cmei_id !== c.cmei_atual_id || c.planned_turma_id !== c.turma_atual_id;
                                    
                                    return (
                                    <TableRow key={c.id} className={cn(hasPlannedChange && "bg-yellow-50/50 hover:bg-yellow-50/70", isSelected && "bg-primary/10 hover:bg-primary/15")}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelection(c.id)}
                                                disabled={isExecuting || isSaving}
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
                                                    <DropdownMenuItem 
                                                        onClick={() => handleRealocacaoIndividualClick(c)}
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
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};