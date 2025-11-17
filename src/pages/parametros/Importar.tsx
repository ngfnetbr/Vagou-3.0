import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { importChildrenData } from "@/lib/utils/import-data";
import { useQueryClient } from "@tanstack/react-query";
import { Separator } from '@/components/ui/separator';

interface ImportResult {
    totalRecords: number;
    successCount: number;
    errorCount: number;
    errors: { row: number, error: string }[];
}

const Importar = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setImportResults(null);
        } else {
            setFile(null);
            toast.error("Formato de arquivo inválido.", {
                description: "Por favor, selecione um arquivo CSV (.csv)."
            });
        }
    };

    const handleImport = () => {
        if (!file) {
            toast.warning("Nenhum arquivo selecionado.");
            return;
        }

        setIsImporting(true);
        setImportResults(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const csvContent = e.target?.result as string;
            
            try {
                const results = await importChildrenData(csvContent);
                setImportResults(results);

                if (results.errorCount === 0) {
                    toast.success("Importação concluída com sucesso!", {
                        description: `${results.successCount} crianças importadas.`,
                    });
                } else {
                    toast.warning("Importação concluída com erros.", {
                        description: `${results.successCount} sucessos, ${results.errorCount} erros. Verifique os detalhes abaixo.`,
                        duration: 8000,
                    });
                }
                
                // Invalidate queries related to children/queue
                queryClient.invalidateQueries({ queryKey: ['criancas'] });
                queryClient.invalidateQueries({ queryKey: ['fila'] });

            } catch (error: any) {
                toast.error("Erro na importação.", {
                    description: error.message || "Ocorreu um erro ao processar o arquivo no servidor.",
                });
            } finally {
                setIsImporting(false);
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };

        reader.onerror = () => {
            toast.error("Erro ao ler o arquivo.");
            setIsImporting(false);
        };

        reader.readAsText(file);
    };

    const renderResults = () => {
        if (!importResults) return null;

        const { totalRecords, successCount, errorCount, errors } = importResults;

        return (
            <div className="mt-6 space-y-4 p-4 border rounded-lg bg-background">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                    {errorCount === 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    Resultado da Importação
                </h4>
                <p className="text-sm text-muted-foreground">Total de linhas processadas: {totalRecords}</p>
                <p className={successCount > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    Sucessos: {successCount}
                </p>
                <p className={errorCount > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                    Erros: {errorCount}
                </p>

                {errorCount > 0 && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-red-50/50">
                        <p className="font-semibold text-sm text-red-700">Detalhes dos Erros:</p>
                        {errors.map((err, index) => (
                            <p key={index} className="text-xs text-red-600">
                                Linha {err.row}: {err.error}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Importar Dados de Crianças
                </CardTitle>
                <CardDescription>
                    Carregue um arquivo CSV para inserir ou atualizar registros de crianças na fila de espera.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-base font-semibold">Modelo de CSV</h3>
                    <p className="text-sm text-muted-foreground">
                        O arquivo CSV deve conter as seguintes colunas (cabeçalhos obrigatórios):
                    </p>
                    <code className="block p-2 text-xs bg-gray-100 rounded-md overflow-x-auto text-gray-700">
                        nome,data_nascimento (AAAA-MM-DD),sexo (M/F),programas_sociais (Sim/Não),aceita_qualquer_cmei (Sim/Não),cmei1_preferencia,cmei2_preferencia,responsavel_nome,responsavel_cpf,responsavel_telefone,responsavel_email,endereco,bairro,observacoes
                    </code>
                    <p className="text-xs text-red-500">
                        Atenção: A importação insere novos registros. Não use para atualização de dados existentes.
                    </p>
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                    <Input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange} 
                        ref={fileInputRef}
                        disabled={isImporting}
                    />
                    
                    <Button 
                        onClick={handleImport} 
                        disabled={!file || isImporting}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isImporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isImporting ? "Importando..." : `Importar ${file ? file.name : 'Arquivo CSV'}`}
                    </Button>
                </div>
                
                {renderResults()}
            </CardContent>
        </Card>
    );
};

export default Importar;