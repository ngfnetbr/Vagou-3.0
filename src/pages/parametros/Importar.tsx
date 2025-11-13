import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Importar = () => {
  const tiposImportacao = [
    {
      titulo: "Importar CMEIs",
      descricao: "Cadastrar múltiplos CMEIs através de planilha",
      modelo: "modelo_cmeis.xlsx"
    },
    {
      titulo: "Importar Crianças",
      descricao: "Cadastrar múltiplas crianças através de planilha",
      modelo: "modelo_criancas.xlsx"
    },
    {
      titulo: "Importar Responsáveis",
      descricao: "Cadastrar múltiplos responsáveis através de planilha",
      modelo: "modelo_responsaveis.xlsx"
    },
    {
      titulo: "Importar Matrículas",
      descricao: "Importar dados de matrículas em massa",
      modelo: "modelo_matriculas.xlsx"
    },
  ];

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Antes de importar dados, faça o download do modelo de planilha correspondente.
          Certifique-se de que os dados estão no formato correto para evitar erros na importação.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {tiposImportacao.map((tipo) => (
          <Card key={tipo.titulo} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{tipo.titulo}</CardTitle>
                  <CardDescription className="mt-1">
                    {tipo.descricao}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Clique para selecionar o arquivo
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos: .xlsx, .xls, .csv
                </p>
              </div>
              
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Baixar Modelo ({tipo.modelo})
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Instruções de Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Baixe o modelo de planilha correspondente ao tipo de dado que deseja importar</li>
            <li>Preencha a planilha com os dados, seguindo o formato do modelo</li>
            <li>Certifique-se de que todos os campos obrigatórios estão preenchidos</li>
            <li>Salve a planilha no formato .xlsx, .xls ou .csv</li>
            <li>Faça o upload do arquivo através do botão "Selecionar arquivo"</li>
            <li>Aguarde a validação e confirmação da importação</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default Importar;