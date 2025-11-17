import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreVertical, Eye, CheckCircle, Bell, XCircle, ListRestart, RotateCcw, Loader2, Trash2, Baby } from "lucide-react";
import { Crianca } from "@/integrations/supabase/types"; // Importação atualizada
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, parseISO, isValid, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import CountdownTimer from "../CountdownTimer"; // Importando o novo componente
import { useCriancas } from "@/hooks/use-criancas"; // Importando useCriancas para a mutação de reenvio

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

// Função para verificar se o prazo expirou (usada para habilitar Reconvocar)
const isDeadlineExpired = (deadline: string | undefined): boolean => {
    if (!deadline) return false;
    const deadlineDate = parseISO(deadline + 'T00:00:00');
    if (!isValid(deadlineDate)) return false;
    return deadlineDate.getTime() < new Date().getTime();
};

// Nova função helper para formatar a data de penalidade com segurança
const formatPenalidadeDate = (dateString: string | undefined): string | null => {
    if (!dateString) return null;
    
    try {
        // Adiciona 'T00:00:00' para garantir que o parse seja feito corretamente
        const date = parseISO(dateString);
        
        if (isValid(date)) {
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        }
        return null;
    } catch (e) {
        console.error("Erro ao formatar data de penalidade:", e);
        return null;
    }
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
  const { resendConvocationNotification, isResendingNotification } = useCriancas(); // Usando o hook de reenvio

  const handleResendNotification = async (criancaId: string) => {
    try {
        await resendConvocationNotification(criancaId);
    } catch (e: any) {
        toast.error("Falha no Reenvio", {
            description: e.message,
        });
    }
  };

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
              <TableHead className="text-center">Prioridade</TableHead>
              <TableHead className="text-center">Status/Prazo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFila.length > 0 ? (
              filteredFila.map((item) => {
                const isConvocado = item.status === "Convocado";
                const isFilaEspera = item.status === "Fila de Espera";
                const isRemanejamento = item.status === "Remanejamento Solicitado";
                
                // NOVO: Verifica se é uma convocação de remanejamento
                const isRemanejamentoAtivo = isRemanejamento || (isConvocado && !!item.cmei_remanejamento_id);
                
                const deadlineExpired = isDeadlineExpired(item.convocacao_deadline);
                
                // --- START: Age Calculation Logic ---
                const dob = parseISO(item.data_nascimento + 'T00:00:00');
                const ageInMonths = isValid(dob) ? differenceInMonths(new Date(), dob) : Infinity;
                const isUnderSixMonths = ageInMonths < 6;
                // --- END: Age Calculation Logic ---
                
                // Lógica para exibir o badge de penalidade: se está na fila E tem data de penalidade
                const isPenalized = isFilaEspera && !!item.data_penalidade;
                
                return (
                  <TableRow key={item.id} className={isConvocado ? "bg-primary/5 hover:bg-primary/10" : isRemanejamentoAtivo ? "bg-accent/5 hover:bg-accent/10" : ""}>
                    <TableCell className="font-bold text-primary">
                        {isRemanejamentoAtivo ? (
                            <Badge className="bg-accent text-accent-foreground w-fit flex justify-center items-center">Remanej.</Badge>
                        ) : isConvocado ? (
                            <Badge className="bg-primary text-primary-foreground w-fit flex justify-center items-center">Conv.</Badge>
                        ) : (
                            `#${item.posicao_fila}`
                        )}
                    </TableCell>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {/* Display Age with Warning if under 6 months */}
                        <div className="flex flex-col items-start">
                            {isUnderSixMonths && (
                                <span className="font-bold text-destructive text-xs mb-1 flex items-center gap-1">
                                    <Baby className="h-3 w-3" /> Menor de 6 meses
                                </span>
                            )}
                            <span>{item.idade}</span>
                        </div>
                    </TableCell>
                    <TableCell>{item.responsavel_nome}</TableCell>
                    <TableCell>{getInscriptionDate(item)}</TableCell>
                    <TableCell className="text-center">
                      {isRemanejamentoAtivo ? (
                        <Badge 
                            variant="default"
                            className="w-fit flex justify-center items-center mx-auto bg-accent hover:bg-accent/80 text-accent-foreground"
                        >
                            Remanejamento
                        </Badge>
                      ) : (
                        <Badge 
                            variant={item.programas_sociais ? "default" : "secondary"}
                            className="w-fit flex justify-center items-center mx-auto"
                        >
                            {getPriorityLabel(item)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                        {isConvocado && item.convocacao_deadline ? (
                            <CountdownTimer deadline={item.convocacao_deadline} />
                        ) : isRemanejamentoAtivo ? (
                            <div className="flex flex-col items-center">
                                <Badge 
                                    variant="outline" 
                                    className="w-fit flex justify-center items-center mx-auto bg-primary/20 text-primary border-primary/50"
                                >
                                    Remanejamento
                                </Badge>
                            </div>
                        ) : (
                            // Se estiver na fila (mesmo que penalizado), exibe apenas Fila de Espera
                            <Badge 
                                variant="outline" 
                                className="w-fit flex justify-center items-center mx-auto bg-accent/20 text-foreground border-accent/50"
                            >
                                Fila de Espera
                            </Badge>
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
                              
                              <DropdownMenuItem 
                                onSelect={() => handleResendNotification(item.id)}
                                disabled={isResendingNotification}
                              >
                                {isResendingNotification ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Bell className="mr-2 h-4 w-4" />
                                )}
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
                          
                          {/* Ações para Fila de Espera e Remanejamento */}
                          {(isFilaEspera || isRemanejamento) && (
                            <>
                                <DropdownMenuItem onSelect={() => handleJustificativaAction(item, 'desistente')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Marcar como desistente (Justificativa)
                                </DropdownMenuItem>
                            </>
                          )}
                          
                          {/* Opção de Convocar / Reconvocar */}
                          {(!isConvocado || (isConvocado && deadlineExpired)) && (
                            <DropdownMenuItem 
                                className="text-primary" 
                                onSelect={() => handleConvocarClick(item)}
                                disabled={isUnderSixMonths} // BLOQUEIO AQUI
                            >
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