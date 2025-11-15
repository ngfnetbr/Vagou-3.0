"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { differenceInSeconds, parseISO, isValid, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  deadline: string; // YYYY-MM-DD
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline }) => {
  const deadlineDate = useMemo(() => {
    // Adiciona 'T00:00:00' para garantir que o parse seja feito corretamente
    const date = parseISO(deadline + 'T00:00:00');
    return isValid(date) ? date : null;
  }, [deadline]);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!deadlineDate) return -1;
    return differenceInSeconds(deadlineDate, new Date());
  });

  useEffect(() => {
    if (!deadlineDate) return;

    const interval = setInterval(() => {
      setSecondsRemaining(differenceInSeconds(deadlineDate, new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineDate]);

  const expirationDateFormatted = deadlineDate ? format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';

  if (!deadlineDate || secondsRemaining < 0) {
    return (
      <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded", "bg-destructive/20 text-destructive")}>
        <XCircle className="h-3 w-3" />
        Expirado ({expirationDateFormatted})
      </div>
    );
  }

  const days = Math.floor(secondsRemaining / (60 * 60 * 24));
  const hours = Math.floor((secondsRemaining % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
  const seconds = secondsRemaining % 60;
  
  const timeString = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  
  const isUrgent = days === 0 && hours < 24;
  
  const className = isUrgent 
    ? "bg-destructive/20 text-destructive animate-pulse" 
    : "bg-accent/20 text-foreground";

  return (
    <div className={cn("flex flex-col items-start text-xs font-medium px-2 py-1 rounded", className)}>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className="font-bold">{timeString}</span>
      </div>
      <span className="text-[10px] opacity-80">
        Prazo final: {expirationDateFormatted}
      </span>
    </div>
  );
};

export default CountdownTimer;