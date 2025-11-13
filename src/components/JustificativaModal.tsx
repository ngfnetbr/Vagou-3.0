"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";

const justificativaSchema = z.object({
  justificativa: z.string().min(10, "A justificativa deve ter pelo menos 10 caracteres."),
});

type JustificativaFormData = z.infer<typeof justificativaSchema>;

interface JustificativaModalProps {
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: (justificativa: string) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

const JustificativaModal = ({ title, description, actionLabel, onConfirm, onClose, isPending }: JustificativaModalProps) => {
  const form = useForm<JustificativaFormData>({
    resolver: zodResolver(justificativaSchema),
    defaultValues: {
      justificativa: "",
    },
  });

  const onSubmit = async (values: JustificativaFormData) => {
    await onConfirm(values.justificativa);
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="justificativa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Justificativa *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o motivo da ação (mínimo 10 caracteres)" 
                    rows={4}
                    {...field} 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default JustificativaModal;