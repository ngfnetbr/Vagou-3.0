import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { History, Eye, ListRestart, MoreVertical, Loader2 } from "lucide-react";
import { Crianca } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

interface HistoricoAccordionProps {
  historicoCriancas: Crianca[];
  isReactivating: boolean;
  handleReativar: (id: number) => Promise<void>;
  getStatusBadge: (status: Crianca['status']) => JSX.Element;
  getFinalizationDate: (crianca: Crianca) => string;
}

export const HistoricoAccordion = ({
  historicoCriancas,
  isReactivating,
  handleReativar,
  getStatusBadge,
  getFinalizationDate,
}: HistoricoAccordionProps) => {
  const navigate = useNavigate();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="historico">
        <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Histórico de Matrículas e Desistências ({historicoCriancas.length})
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criança</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status Final</TableHead>
                    <TableHead>CMEI/Turma</TableHead>
                    <TableHead>Data Final</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoCriancas.length > 0 ? (
                    historicoCriancas.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{item.responsavel}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{item.cmei !== "N/A" ? `${item.cmei} (${item.turmaAtual || 'N/A'})` : '-'}</TableCell>
                        <TableCell>{getFinalizationDate(item)}</TableCell>
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
                              {(item.status === "Desistente" || item.status === "Recusada") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-secondary focus:bg-secondary/10 focus:text-secondary">
                                      <ListRestart className="mr-2 h-4 w-4" />
                                      Reativar na Fila
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Reativação?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação reativará <span className="font-semibold">{item.nome}</span> na fila de espera, colocando-a no final da fila.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel disabled={isReactivating}>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleReativar(item.id)} 
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                        disabled={isReactivating}
                                      >
                                        {isReactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Reativação"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                        Nenhum registro de matrícula ou desistência encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};