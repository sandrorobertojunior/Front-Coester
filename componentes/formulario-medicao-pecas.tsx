"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Ruler,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Calculator,
  Info,
} from "lucide-react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";

const obterTiposPecas = () => [
  {
    id: "eixo-transmissao",
    nome: "Eixo de Transmissão",
    campos: [
      {
        nome: "comprimento",
        label: "Comprimento (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 500,
      },
      {
        nome: "diametro",
        label: "Diâmetro (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 100,
      },
    ],
    especificacoes: {
      comprimento: { min: 140, max: 160, tolerancia: 0.1 },
      diametro: { min: 24, max: 26, tolerancia: 0.1 },
    },
  },
  {
    id: "engrenagem",
    nome: "Engrenagem",
    campos: [
      {
        nome: "diametro",
        label: "Diâmetro (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 200,
      },
      {
        nome: "espessura",
        label: "Espessura (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 50,
      },
      {
        nome: "numeroDentes",
        label: "Número de Dentes",
        tipo: "number",
        obrigatorio: true,
        min: 1,
        max: 200,
      },
    ],
    especificacoes: {
      diametro: { min: 75, max: 85, tolerancia: 0.05 },
      espessura: { min: 10, max: 14, tolerancia: 0.05 },
    },
  },
  {
    id: "parafuso-m8",
    nome: "Parafuso M8",
    campos: [
      {
        nome: "comprimento",
        label: "Comprimento (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 100,
      },
      {
        nome: "diametro",
        label: "Diâmetro (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 20,
      },
      {
        nome: "passo",
        label: "Passo da Rosca (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 5,
        step: 0.1,
      },
    ],
    especificacoes: {
      comprimento: { min: 38, max: 42, tolerancia: 0.02 },
      diametro: { min: 7.8, max: 8.2, tolerancia: 0.02 },
    },
  },
  {
    id: "bucha",
    nome: "Bucha",
    campos: [
      {
        nome: "diametroInterno",
        label: "Diâmetro Interno (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 100,
      },
      {
        nome: "diametroExterno",
        label: "Diâmetro Externo (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 100,
      },
      {
        nome: "altura",
        label: "Altura (mm)",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 100,
      },
    ],
    especificacoes: {
      diametroInterno: { min: 14.5, max: 15.5, tolerancia: 0.03 },
      diametroExterno: { min: 24.5, max: 25.5, tolerancia: 0.03 },
    },
  },
];

interface FormularioMedicaoPecasProps {
  onVoltar?: () => void;
}

export function FormularioMedicaoPecas({
  onVoltar,
}: FormularioMedicaoPecasProps) {
  const { usuario } = useAutenticacao();
  const [tiposPecas, setTiposPecas] = useState(obterTiposPecas());
  const [tipoPecaSelecionada, setTipoPecaSelecionada] = useState<string>("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [medicaoSalva, setMedicaoSalva] = useState(false);

  useEffect(() => {
    setTiposPecas(obterTiposPecas());
  }, []);

  // Obtém o tipo de peça selecionado
  const tipoPeca = tiposPecas.find((t) => t.id === tipoPecaSelecionada);

  // Atualiza valor de um campo
  const atualizarValor = (campo: string, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    // Remove erro do campo quando usuário começa a digitar
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: "" }));
    }
  };

  // Valida um campo específico
  const validarCampo = (campo: any, valor: string) => {
    if (campo.obrigatorio && !valor.trim()) {
      return `${campo.label} é obrigatório`;
    }

    const numeroValor = Number.parseFloat(valor);
    if (isNaN(numeroValor)) {
      return `${campo.label} deve ser um número válido`;
    }

    if (campo.min !== undefined && numeroValor < campo.min) {
      return `${campo.label} deve ser maior que ${campo.min}`;
    }

    if (campo.max !== undefined && numeroValor > campo.max) {
      return `${campo.label} deve ser menor que ${campo.max}`;
    }

    return "";
  };

  // Verifica se valor está dentro das especificações
  const verificarEspecificacao = (nomeCampo: string, valor: string) => {
    if (!tipoPeca?.especificacoes[nomeCampo]) return "info";

    const numeroValor = Number.parseFloat(valor);
    if (isNaN(numeroValor)) return "info";

    const spec = tipoPeca.especificacoes[nomeCampo];
    if (numeroValor >= spec.min && numeroValor <= spec.max) {
      return "aprovado";
    } else {
      return "fora-spec";
    }
  };

  // Valida todo o formulário
  const validarFormulario = () => {
    if (!tipoPecaSelecionada) {
      setErros({ geral: "Selecione um tipo de peça" });
      return false;
    }

    const novosErros: Record<string, string> = {};

    tipoPeca?.campos.forEach((campo) => {
      const valor = valores[campo.nome] || "";
      const erro = validarCampo(campo, valor);
      if (erro) {
        novosErros[campo.nome] = erro;
      }
    });

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Reseta o formulário
  const resetarFormulario = () => {
    setTipoPecaSelecionada("");
    setValores({});
    setObservacoes("");
    setErros({});
    setMedicaoSalva(false);
  };

  // Salva a medição
  const salvarMedicao = async () => {
    if (!validarFormulario()) return;

    setSalvando(true);

    // Simula salvamento no backend
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Aqui seria feita a integração com o backend
    const medicao = {
      id: Date.now().toString(),
      tipoPeca: tipoPeca?.nome,
      valores,
      observacoes,
      operador: usuario?.nome,
      dataHora: new Date().toLocaleString("pt-BR"),
      status: "pendente", // Seria calculado baseado nas especificações
    };

    console.log("Medição salva:", medicao);

    setSalvando(false);
    setMedicaoSalva(true);
  };

  if (medicaoSalva) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700">
              Medição Registrada!
            </CardTitle>
            <CardDescription>
              A medição da peça {tipoPeca?.nome} foi registrada com sucesso no
              sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo da Medição:</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Tipo:</strong> {tipoPeca?.nome}
                </p>
                <p>
                  <strong>Operador:</strong> {usuario?.nome}
                </p>
                <p>
                  <strong>Data/Hora:</strong>{" "}
                  {new Date().toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={resetarFormulario} className="flex-1">
                Nova Medição
              </Button>
              <Button
                variant="outline"
                onClick={onVoltar}
                className="flex-1 bg-transparent"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nova Medição de Peça
        </h1>
        <p className="text-muted-foreground">
          Registre as medições de uma nova peça no sistema
        </p>
      </div>

      <div className="space-y-6">
        {/* Seleção do Tipo de Peça */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Tipo de Peça
            </CardTitle>
            <CardDescription>
              Selecione o tipo de peça que será medida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={tipoPecaSelecionada}
              onValueChange={setTipoPecaSelecionada}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de peça..." />
              </SelectTrigger>
              <SelectContent>
                {tiposPecas.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.geral && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{erros.geral}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Formulário de Medições */}
        {tipoPeca && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Medições - {tipoPeca.nome}
              </CardTitle>
              <CardDescription>
                Insira as medições para cada dimensão da peça
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Especificações da Peça */}
              {Object.keys(tipoPeca.especificacoes).length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Especificações Técnicas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {Object.entries(tipoPeca.especificacoes).map(
                      ([campo, spec]) => (
                        <div key={campo} className="flex justify-between">
                          <span className="capitalize">
                            {campo.replace(/([A-Z])/g, " $1").toLowerCase()}:
                          </span>
                          <span className="font-medium">
                            {spec.min}mm - {spec.max}mm (±{spec.tolerancia}mm)
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Campos de Medição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tipoPeca.campos.map((campo) => {
                  const valor = valores[campo.nome] || "";
                  const statusSpec = verificarEspecificacao(campo.nome, valor);

                  return (
                    <div key={campo.nome} className="space-y-2">
                      <Label
                        htmlFor={campo.nome}
                        className="flex items-center gap-2"
                      >
                        {campo.label}
                        {campo.obrigatorio && (
                          <span className="text-red-500">*</span>
                        )}
                        {valor && statusSpec === "aprovado" && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {valor && statusSpec === "fora-spec" && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </Label>
                      <Input
                        id={campo.nome}
                        type={campo.tipo}
                        min={campo.min}
                        max={campo.max}
                        step={campo.step}
                        value={valor}
                        onChange={(e) =>
                          atualizarValor(campo.nome, e.target.value)
                        }
                        placeholder={`Digite ${campo.label.toLowerCase()}`}
                        className={erros[campo.nome] ? "border-red-500" : ""}
                      />
                      {erros[campo.nome] && (
                        <p className="text-sm text-red-600">
                          {erros[campo.nome]}
                        </p>
                      )}
                      {valor && statusSpec === "fora-spec" && (
                        <p className="text-sm text-red-600">
                          Valor fora da especificação técnica
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações sobre a medição (opcional)"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Status da Medição */}
              {Object.keys(valores).length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Status da Medição:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tipoPeca.campos.map((campo) => {
                      const valor = valores[campo.nome];
                      if (!valor) return null;

                      const status = verificarEspecificacao(campo.nome, valor);
                      return (
                        <Badge
                          key={campo.nome}
                          variant={
                            status === "aprovado"
                              ? "default"
                              : status === "fora-spec"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {campo.label}:{" "}
                          {status === "aprovado"
                            ? "OK"
                            : status === "fora-spec"
                            ? "Fora de Spec"
                            : "Pendente"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        {tipoPeca && (
          <div className="flex gap-3">
            <Button
              onClick={salvarMedicao}
              disabled={salvando}
              className="flex-1 sm:flex-none"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Medição
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetarFormulario}
              className="flex-1 sm:flex-none bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            {onVoltar && (
              <Button
                variant="ghost"
                onClick={onVoltar}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
