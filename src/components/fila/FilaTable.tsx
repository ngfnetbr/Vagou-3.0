import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreVertical, Eye, CheckCircle, Bell, XCircle, ListRestart, RotateCcw, Loader2, Trash2 } from "lucide-react";
import { Crianca } from "@/integrations/supabase/types"; // Importação atualizada
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importando ptBR

type JustificativaAction = 'recusada' | 'desistente' | 'fim_de_fila';

interface FilaTableProps {
  filteredFila: Crianca[];
  isConfirmingMatricula: boolean;
  handleConfirmarMatricula: (id: string) => Promise<void>; // ID agora é string
  handleConvocarClick: (crianca: Crianca) => void;
  handleJustificativaAction: (crianca: Crianca, action: JustificativaAction) => void;
  getPriorityLabel: (crianca: Crianca) => string;
  getInscriptionDate: (crianca: Crianca) => string;
}

// Helper functions (copied from Fila.tsx to keep FilaTable self-contained regarding display logic)
const getDeadlineInfo = (deadline: string) => {
    const deadlineDate = parseISO(deadline + 'T00:00:00');
    const today = new Date();
    const daysRemaining = differenceInDays(deadlineDate, today);
    
    const isExpired = daysRemaining < 0;

    if (isExpired) {
        return {
            text: `Prazo Expirado (${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })})`,
            className: "bg-destructive/20 text-destructive",
            icon: XCircle,
            isExpired: true,
        };
    }
    
    return {
        text: `Prazo: ${daysRemaining} dias (até ${format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR })})`,
        className: "bg-accent/20 text-foreground",
        icon: Clock,
        isExpired: false,
    };
};

export const FilaTable = ({
  filteredFila,
  isConfirmingMatricula,
  handleConfirmarMatricula,
  handleConvocarClick,
  handleJustificativaAction,
  getPriorityLabel,
  getInscriptionDate,
}: FilaTableProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Posição</TableHead>
              <TableHead>Criança</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data Insc.</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status/Prazo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFila.length > 0 ? (
              filteredFila.map((item) => {
                const isConvocado = item.status === "Convocado";
                const isFilaEspera = item.status === "Fila de Espera";
                const deadlineInfo = isConvocado && item.convocacao_deadline ? getDeadlineInfo(item.convocacao_deadline) : null;
                
                // Verifica se há penalidade (Fim de Fila)
                const isPenalized = isFilaEspera && item.data_penalidade;
                const penalidadeDate = isPenalized ? format(parseISO(item.data_penalidade + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : null;
                
                return (
                  <TableRow key={item.id} className={isConvocado ? "bg-primary/5 hover:bg-primary/10" : ""}>
                    <TableCell className="font-bold text-primary">
                        {isConvocado ? <Badge className="bg-primary text-primary-foreground">CONV.</Badge> : `#${item.posicao_fila}`}
                    </TableCell>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.idade}</TableCell>
                    <TableCell>{item.responsavel_nome}</TableCell>
                    <TableCell>{getInscriptionDate(item)}</TableCell>
                    <TableCell>
                      <Badge variant={item.programas_sociais ? "default" : "secondary"}>
                        {getPriorityLabel(item)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {isConvocado && deadlineInfo ? (
                            <div className={`flex items-center gap-1 text-xs font-medium p-1 rounded ${deadlineInfo.className}`}>
                                <deadlineInfo.icon className="h-3 w-3" />
                                {deadlineInfo.text}
                            </div>
                        ) : isPenalized ? (
                            <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                                Fim de Fila ({penalidadeDate})
                            </Badge>
                        ) : (
                            <Badge variant="secondary">Fila de Espera</Badge>
                        )}
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
                          
                          {/* Ações para Convocados */}
                          {isConvocado && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-secondary focus:bg-secondary/10 focus:text-secondary" disabled={isConfirmingMatricula}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirmar matrícula
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Matrícula?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Você está confirmando a matrícula de <span className="font-semibold">{item.nome}</span> no CMEI {item.cmeiNome}. Esta ação é irreversível.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isConfirmingMatricula}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleConfirmarMatricula(item.id)} 
                                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                      disabled={isConfirmingMatricula}
                                    >
                                      {isConfirmingMatricula ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Matrícula"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <DropdownMenuItem onSelect={() => toast.info("Reenviar notificação em desenvolvimento...")}>
                                <Bell className="mr-2 h-4 w-4" />
                                Reenviar notificação
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'recusada')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Marcar como recusada (Justificativa)
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'fim_de_fila')} className="text-accent focus:bg-accent/10 focus:text-accent">
                                <ListRestart className="mr-2 h-4 w-4" />
                                Marcar Fim de Fila (Justificativa)
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'desistente')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Marcar como desistente (Justificativa)
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {/* Ações para Fila de Espera */}
                          {isFilaEspera && (
                            <>
                                <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'desistente')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Marcar como desistente (Justificativa)
                                </DropdownMenuItem>
                            </>
                          )}
                          
                          {/* Opção de Convocar / Reconvocar */}
                          {(!isConvocado || (isConvocado && deadlineInfo?.isExpired)) && (
                            <DropdownMenuItem className="text-primary" onSelect={() => handleConvocarClick(item)}>
                              {isConvocado ? (
                                <>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reconvocar para matrícula
                                </>
                              ) : (
                                <>
                                  <Bell className="mr-2 h-4 w-4" />
                                  Convocar para matrícula
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Nenhuma criança na fila de espera ou convocada com os filtros aplicados.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};