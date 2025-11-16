"use client";

import React, { useMemo, useState, useEffect } from 'react';
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

  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (!deadlineDate) return -1;
    return differenceInSeconds(deadlineDate, new Date());
  });

  useEffect(() => {
    if (secondsRemaining < 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const expirationDateFormatted = deadlineDate ? format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';

  if (!deadlineDate || secondsRemaining < 0) {
    return (
      <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded w-fit mx-auto", "bg-destructive/20 text-destructive")}>
        <XCircle className="h-3 w-3" />
        Expirado ({expirationDateFormatted})
      </div>
    );
  }

  const days = Math.floor(secondsRemaining / (60 * 60 * 24));
  const hours = Math.floor((secondsRemaining % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
  const seconds = secondsRemaining % 60;
  
  const timeParts = [];
  if (days > 0) timeParts.push(`${days}d`);
  if (hours > 0 || days > 0) timeParts.push(`${hours}h`);
  timeParts.push(`${minutes}m`);
  timeParts.push(`${seconds}s`);
  
  const timeString = timeParts.join(' ');
  
  // Define urgência se faltar 1 dia ou menos
  const isUrgent = days === 0;
  
  const className = isUrgent 
    ? "bg-destructive/20 text-destructive" 
    : "bg-accent/20 text-foreground";

  return (
    <div className={cn("flex flex-col items-start text-xs font-medium px-2 py-1 rounded w-fit mx-auto", className)}>
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