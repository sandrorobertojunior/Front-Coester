"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Ruler,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Calculator,
  Info,
  Gauge,
  Loader,
  ThumbsUp,
  ThumbsDown,
  Bluetooth,
  Plug,
  Unplug,
} from "lucide-react";
import {
  CampoPeca,
  IFormularioMedicaoViewProps,
} from "@/hooks/formulario-medicao.types";
import { useConnectarBluetooth } from "@/hooks/useConnectarBluetooth";

interface LoteDisponivel {
  id: number;
  codigoLote: string;
  descricao: string;
  status: "EM_ANDAMENTO" | "EM_ANALISE" | "APROVADO" | "REPROVADO" | string;
}

export function FormularioMedicaoPecas({
  lotesDisponiveis,
  carregandoLotes,
  loteSelecionadoId,
  setLoteSelecionadoId,
  tipoPeca,
  pecasNoLote,
  modo,
  pecaAtual,
  cotaAtual,
  valores,
  observacoes,
  erros,
  medicoesAcumuladas,
  salvando,
  loteCompletado,
  loteAprovado,
  usuarioNome,
  setModo,
  atualizarValor,
  setObservacoes,
  salvarMedicao,
  resetarFormulario,
  verificarEspecificacao,
  existeErroCritico,
  onVoltar,
  recomecarMedicao,
  cancelarMedicao,
}: IFormularioMedicaoViewProps & { lotesDisponiveis: LoteDisponivel[] }) {
  const podeMostrarInputs =
    modo === "peca-a-peca" || (modo === "cota-a-cota" && cotaAtual);

  const {
    connect,
    disconnect,
    isConnected,
    valorMicrometro,
    status,
    deviceName,
    resetarValorMicrometro, // <-- Pegando a nova função do hook
  } = useConnectarBluetooth();

  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const [campoFocado, setCampoFocado] = useState<string | null>(null);

  const camposParaFoco = useMemo(() => {
    if (!tipoPeca) return [];
    if (modo === "peca-a-peca") {
      return tipoPeca.campos
        .filter((c) => c.tipo === "number")
        .map((c) => c.nome);
    }
    if (modo === "cota-a-cota" && cotaAtual) {
      return [cotaAtual.nome];
    }
    return [];
  }, [modo, tipoPeca, cotaAtual]);

  const passarProProximoInput = useCallback(() => {
    if (!campoFocado) {
      const primeiroCampo = camposParaFoco[0];
      if (primeiroCampo) {
        setCampoFocado(primeiroCampo);
        inputRefs.current[primeiroCampo]?.focus();
      }
      return;
    }
    const currentIndex = camposParaFoco.indexOf(campoFocado);
    if (currentIndex === -1 || currentIndex === camposParaFoco.length - 1) {
      return;
    }
    const nextCampo = camposParaFoco[currentIndex + 1];
    if (nextCampo) {
      setCampoFocado(nextCampo);
      inputRefs.current[nextCampo]?.focus();
    }
  }, [campoFocado, camposParaFoco]);

  // [MUDANÇA PRINCIPAL] Lógica de reset do valor
  useEffect(() => {
    // Só executa se tivermos um valor válido e um campo focado
    if (valorMicrometro === "0.000" || !campoFocado) {
      return;
    }

    // 1. Aplica o valor recebido no campo focado
    atualizarValor(campoFocado, valorMicrometro);

    // 2. Reseta imediatamente o valor no hook para "0.000"
    // Isso "consome" o valor e previne que o useEffect seja disparado de novo com o mesmo valor.
    resetarValorMicrometro();

    // 3. Move o foco para o próximo campo
    passarProProximoInput();
  }, [
    valorMicrometro,
    campoFocado,
    atualizarValor,
    resetarValorMicrometro,
    passarProProximoInput,
  ]);

  useEffect(() => {
    if (modo && tipoPeca && camposParaFoco.length > 0 && !campoFocado) {
      passarProProximoInput();
    }
  }, [modo, tipoPeca, camposParaFoco, campoFocado, passarProProximoInput]);

  const CampoMedicaoAutomatica = ({ campo }: { campo: CampoPeca }) => {
    const valor = valores[campo.nome] || "";
    const statusSpec = verificarEspecificacao(campo.nome, valor);
    const showCheck = campo.tipo === "number" && valor && statusSpec !== "info";
    const isFocoAtivo = campoFocado === campo.nome;
    return (
      <div key={campo.nome} className="space-y-2">
        <Label
          htmlFor={campo.nome}
          className={`flex items-center gap-2 ${
            isFocoAtivo ? "font-bold text-blue-600" : "text-gray-700"
          }`}
        >
          {campo.label}
          {campo.obrigatorio && <span className="text-red-500">*</span>}
          {showCheck && (
            <CheckCircle
              className={`h-4 w-4 ${
                statusSpec === "aprovado" ? "text-green-600" : "text-red-600"
              }`}
            />
          )}
        </Label>
        <Input
          id={campo.nome}
          ref={(el) => {
            if (el) inputRefs.current[campo.nome] = el;
          }}
          type={campo.tipo}
          min={campo.min}
          max={campo.max}
          step={campo.step}
          value={valor}
          onChange={(e) => atualizarValor(campo.nome, e.target.value)}
          placeholder={`Aguardando medição BT...`}
          readOnly={campo.tipo === "number" && isConnected}
          className={`${erros[campo.nome] ? "border-red-500" : ""} ${
            isFocoAtivo
              ? "border-2 border-blue-500 bg-blue-50/50"
              : "bg-gray-100"
          } transition-all`}
          onFocus={() => setCampoFocado(campo.nome)}
        />
        {erros[campo.nome] && (
          <p className="text-sm text-red-600">{erros[campo.nome]}</p>
        )}
      </div>
    );
  };

  // ... (O resto do seu código permanece exatamente igual)
  const isLoteConcluido = loteCompletado && loteAprovado !== null;
  const statusFinal =
    loteAprovado === true
      ? "APROVADO"
      : loteAprovado === false
      ? "REPROVADO"
      : "EM ANÁLISE";
  const isAprovado = statusFinal === "APROVADO";
  const statusColor = isAprovado ? "text-green-600" : "text-red-600";
  const bgColor = isAprovado ? "bg-green-100" : "bg-red-100";
  const getSubmitButtonText = () => {
    if (modo === "peca-a-peca") {
      return pecaAtual < pecasNoLote
        ? "Salvar e Próxima Amostra"
        : "Finalizar Lote";
    }
    if (modo === "cota-a-cota") {
      const isUltimaCota =
        tipoPeca?.campos &&
        cotaAtual &&
        cotaAtual.nome === tipoPeca.campos[tipoPeca.campos.length - 1].nome;
      const isUltimaPecaDaCota = pecaAtual === pecasNoLote;
      if (isUltimaCota && isUltimaPecaDaCota) {
        return "Finalizar Lote";
      }
      if (isUltimaPecaDaCota) {
        return "Salvar e Próxima Cota";
      }
      return "Salvar e Próxima Amostra";
    }
    return "Salvar Medição";
  };
  if (isLoteConcluido) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className={`p-6 rounded-lg ${bgColor} mb-4`}>
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-white shadow-md">
                  {statusFinal === "APROVADO" ? (
                    <ThumbsUp className="h-10 w-10 text-green-600" />
                  ) : (
                    <ThumbsDown className="h-10 w-10 text-red-600" />
                  )}
                </div>
              </div>
              <CardTitle
                className={`text-4xl font-extrabold ${statusColor} mb-2`}
              >
                LOTE {statusFinal}!
              </CardTitle>
            </div>
            <CardTitle className="text-2xl text-blue-700">
              Registro de Medição Concluído!
            </CardTitle>
            <CardDescription>
              O preenchimento das **{medicoesAcumuladas.length || pecasNoLote}**
              medições de amostra para o lote **{loteSelecionadoId}** foi
              finalizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo:</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Tipo:</strong> {tipoPeca?.nome}
                </p>
                <p>
                  <strong>Peças Amostradas:</strong> {medicoesAcumuladas.length}{" "}
                  /{pecasNoLote}
                </p>
                <p>
                  <strong>Modo de Preenchimento:</strong>{" "}
                  {modo === "peca-a-peca" ? "Peça-a-Peça" : "Cota-a-Cota"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  resetarFormulario();
                  if (onVoltar) onVoltar();
                }}
                className="flex-1"
              >
                Iniciar Novo Lote
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
  const lotesAtivos = lotesDisponiveis.filter(
    (lote) => lote.status === "EM_ANDAMENTO" || lote.status === "EM_ANALISE"
  );
  const lotesParaSelect = Array.from(new Set(lotesAtivos.map((l) => l.id))).map(
    (id) => lotesAtivos.find((l) => l.id === id)!
  );
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Registro de Medições de Lote
        </h1>
        <p className="text-muted-foreground">
          Preencha as medições da amostra **{pecaAtual}** de **{pecasNoLote}**
        </p>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              1. Selecione o Lote
            </CardTitle>
            <CardDescription>
              Selecione o Lote de produção a ser inspecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={loteSelecionadoId ? String(loteSelecionadoId) : ""}
              onValueChange={(value) =>
                setLoteSelecionadoId(value ? Number(value) : null)
              }
              disabled={medicoesAcumuladas.length > 0 || carregandoLotes}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    carregandoLotes
                      ? "Carregando Lotes Disponíveis..."
                      : "Selecione o Lote para medição..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {lotesParaSelect.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>
                      Lotes Ativos (Em Andamento/Análise)
                    </SelectLabel>
                    {lotesParaSelect.map((lote) => (
                      <SelectItem key={lote.id} value={String(lote.id)}>
                        {lote.codigoLote} - {lote.descricao} (
                        {lote.status.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhum lote ativo disponível.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {tipoPeca && (
              <Alert className="mt-4 border-l-4 border-l-blue-500">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Lote Selecionado: **{tipoPeca.nome}**. Amostragem Necessária:
                  **{pecasNoLote}** peças.
                </AlertDescription>
              </Alert>
            )}
            {erros.critico && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>**{erros.critico}**</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {tipoPeca && !modo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                2. Escolha o Modo de Preenchimento
              </CardTitle>
              <CardDescription>
                Você prefere medir o lote amostrado peça por peça ou cota por
                cota?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={() => setModo("peca-a-peca")}
                className="flex-1 h-20 flex-col"
                variant="outline"
              >
                **Peça-a-Peça**
                <span className="text-xs font-normal">
                  (Todos os campos de uma amostra de cada vez)
                </span>
              </Button>
              <Button
                onClick={() => setModo("cota-a-cota")}
                className="flex-1 h-20 flex-col"
                variant="outline"
              >
                **Cota-a-Cota**
                <span className="text-xs font-normal">
                  (Uma dimensão de todas as amostras de cada vez)
                </span>
              </Button>
            </CardContent>
          </Card>
        )}

        {tipoPeca && modo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {modo === "peca-a-peca"
                  ? `Medição da AMOSTRA ${pecaAtual} de ${pecasNoLote}`
                  : `Medição da COTA: ${
                      cotaAtual?.label || "Carregando..."
                    } (Amostra ${pecaAtual} de ${pecasNoLote})`}
              </CardTitle>
              <CardDescription>
                Registre os valores medidos para esta amostra.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert
                className={`border-l-4 ${
                  isConnected ? "border-l-green-500" : "border-l-red-500"
                }`}
              >
                {isConnected ? (
                  <Plug className="h-4 w-4" />
                ) : (
                  <Unplug className="h-4 w-4" />
                )}
                <AlertTitle>
                  {isConnected
                    ? "Conectado via Bluetooth"
                    : "Bluetooth Desconectado"}
                </AlertTitle>
                <AlertDescription>
                  {status}
                  {deviceName && isConnected && (
                    <span className="ml-2 font-semibold">({deviceName})</span>
                  )}
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="flex justify-between text-sm text-muted-foreground">
                {modo === "peca-a-peca" ? (
                  <span>
                    Progresso do Lote: **{medicoesAcumuladas.length}** /{" "}
                    {pecasNoLote} amostras preenchidas.
                  </span>
                ) : (
                  <span>
                    **Progresso da Cota**: {pecaAtual - 1} / {pecasNoLote}{" "}
                    amostras desta cota concluídas.
                  </span>
                )}
                <span>Operador: **{usuarioNome}**</span>
              </div>

              <Separator />

              {modo === "peca-a-peca" && tipoPeca?.campos && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tipoPeca.campos.map((campo) => (
                    <CampoMedicaoAutomatica key={campo.nome} campo={campo} />
                  ))}
                </div>
              )}

              {modo === "cota-a-cota" && cotaAtual && (
                <div className="max-w-md">
                  <CampoMedicaoAutomatica campo={cotaAtual} />
                </div>
              )}

              <Separator />

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
            </CardContent>
          </Card>
        )}

        {tipoPeca && modo && (
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={salvarMedicao}
              disabled={salvando || !podeMostrarInputs || existeErroCritico()}
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
                  {getSubmitButtonText()}
                </>
              )}
            </Button>

            <Button
              variant={isConnected ? "destructive" : "default"}
              onClick={isConnected ? disconnect : connect}
              className="flex-1 sm:flex-none"
            >
              <Bluetooth className="h-4 w-4 mr-2" />
              {isConnected ? "Desconectar BT" : "Conectar Bluetooth"}
            </Button>

            <Button
              variant="outline"
              onClick={recomecarMedicao}
              className="flex-1 sm:flex-none bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recomeçar Lote
            </Button>

            {onVoltar && (
              <Button
                variant="ghost"
                onClick={cancelarMedicao}
                className="flex-1 sm:flex-none"
                disabled={salvando}
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
