"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Ruler,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import {
  CriarLoteRequestData,
  DashboardAPI,
  LoteResumidoAPI,
  TipoPecaAPI,
  useControleQualidadeApi,
} from "@/contextos/api/controlequalidade";

const DADOS_INICIAIS: DashboardAPI = {
  totalLotes: 0,
  lotesEmAndamento: 0,
  lotesConcluidos: 0,
  taxaAprovacaoGeral: 0,
  tempoMedioMedicaoMinutos: 0,
  lotesRecentes: [],
};

export function DashboardUsuario() {
  const { usuario } = useAutenticacao();
  const api = useControleQualidadeApi();
  const [dashboardData, setDashboardData] = useState<DashboardAPI | null>(null);
  const [lotesDoUsuario, setLotesDoUsuario] = useState<LoteResumidoAPI[]>([]);
  const [tiposPeca, setTiposPeca] = useState<TipoPecaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");
  const [dialogLoteAberto, setDialogLoteAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [termoBusca, setTermoBusca] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashData, lotes, tipos] = await Promise.all([
          api.obterDashboard(),
          api.listarLotesDoUsuario(),
          api.listarTiposPeca(),
        ]);
        setDashboardData(dashData);
        setLotesDoUsuario(lotes);
        setTiposPeca(tipos);
      } catch (err: any) {
        const axiosStatus = err.response?.status;
        let errorMessage = "Erro ao conectar com o servidor.";
        if (axiosStatus === 403) {
          errorMessage =
            "Acesso negado (403). Verifique sua autenticação Basic.";
        } else if (err.message.includes("403")) {
          errorMessage = "Erro ao carregar dados. (403 Forbidden).";
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    if (usuario) {
      fetchData();
    }
  }, [usuario]);

  const handleCriarLote = async (dadosLote: {
    tipoPecaId: number;
    quantidade: number;
    descricao: string;
    quantidadeAmostras: number;
  }) => {
    setLoading(true);
    try {
      const requestData: CriarLoteRequestData = {
        descricao: dadosLote.descricao,
        tipoPecaId: dadosLote.tipoPecaId,
        quantidadePecas: dadosLote.quantidade,
        quantidadeAmostrasDesejada: dadosLote.quantidadeAmostras,
      };
      const novoLote = await api.criarLote(requestData);
      const loteParaOEstado: LoteResumidoAPI = {
        id: novoLote.id,
        codigoLote: novoLote.codigoLote,
        descricao: novoLote.descricao,
        tipoPecaNome: novoLote.tipoPeca.nome,
        quantidadePecas: novoLote.quantidadePecas,
        quantidadeAmostras: novoLote.quantidadeAmostras,
        taxaAprovacao: novoLote.taxaAprovacao,
        status: novoLote.status,
        dataCriacao: novoLote.dataCriacao,
      };
      setLotesDoUsuario((prevLotes) => [loteParaOEstado, ...prevLotes]);
      setDialogLoteAberto(false);
    } catch (err: any) {
      console.error("Erro ao criar lote:", err);
      const errorMessage = (err as Error)?.message || "Erro ao criar lote.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const lotesFiltrados = lotesDoUsuario.filter((lote) => {
    let matchStatus = true;
    if (filtroStatus !== "todos") {
      if (filtroStatus === "CONCLUIDO") {
        matchStatus = lote.status === "APROVADO" || lote.status === "REPROVADO";
      } else {
        matchStatus = lote.status === filtroStatus;
      }
    }
    const matchBusca =
      lote.tipoPecaNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      lote.codigoLote.toLowerCase().includes(termoBusca.toLowerCase());
    return matchStatus && matchBusca;
  });

  if (loading && lotesDoUsuario.length === 0 && !dashboardData && !error) {
    return <div className="p-6">Carregando dados do Dashboard e Lotes...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 space-y-4">
        <h2 className="text-xl font-bold">Erro Fatal de Carregamento</h2>
        <p>
          Ocorreu um erro ao carregar os dados iniciais:
          <strong>{error}</strong>
        </p>
        <p className="text-sm text-yellow-700">
          **Ação Necessária:** O erro mais comum aqui é o
          <strong>403 Forbidden</strong>. Se você usa Login Basic, verifique se
          o seu cliente Axios está enviando o cabeçalho
          <code>Authorization: Basic &lt;token&gt;</code>
          corretamente após o login.
        </p>
        <Button onClick={() => setError(null)} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const stats = dashboardData || DADOS_INICIAIS;

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard de Qualidade
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo(a), {usuario?.nome || "Usuário"}! Aqui estão seus dados de
            controle de qualidade.
          </p>
        </div>
        <Button
          className="mt-4 sm:mt-0"
          onClick={() => setDialogLoteAberto(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Lote de Medição
        </Button>
      </header>
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="medicoes">Meus Lotes</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lotes Totais
                </CardTitle>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLotes}</div>
                <p className="text-xs text-muted-foreground">
                  Lotes no seu controle
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lotes Em Andamento
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.lotesEmAndamento}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando medições
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Aprovação Geral
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.taxaAprovacaoGeral.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Média de todas as peças
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio por Peça
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.tempoMedioMedicaoMinutos.toFixed(1)}
                  min
                </div>
                <p className="text-xs text-muted-foreground">Por peça medida</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Lotes Recentes</CardTitle>
              <CardDescription>
                Seus últimos lotes criados ou atualizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.lotesRecentes.slice(0, 4).map((lote) => (
                  <div
                    key={lote.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">#{lote.codigoLote}</p>
                        <Badge
                          variant={
                            lote.status === "CONCLUIDO"
                              ? "default"
                              : "secondary"
                          }
                          className="flex items-center gap-1 uppercase"
                        >
                          {lote.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {lote.tipoPecaNome}
                      </p>
                    </div>
                    <div className="w-1/3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Amostras:
                        {lote.quantidadeAmostras}
                      </p>
                      <Progress
                        value={
                          lote.quantidadeAmostras > 0
                            ? (lote.quantidadeAmostras /
                                lote.quantidadeAmostras) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="medicoes" className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código do lote ou tipo de peça..."
                      className="w-full pl-10"
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                    <SelectItem value="REPROVADO">Reprovado</SelectItem>
                    <SelectItem value="APROVADO">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Meus Lotes de Medição</CardTitle>
              <CardDescription>
                {lotesFiltrados.length} lotes encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cód. Lote</TableHead>
                    <TableHead>Tipo de Peça</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amostras</TableHead>
                    <TableHead>Qtd. Total</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotesFiltrados.map((lote) => (
                    <TableRow key={lote.id}>
                      <TableCell className="font-medium">
                        #{lote.codigoLote}
                      </TableCell>
                      <TableCell>{lote.tipoPecaNome}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lote.status === "APROVADO"
                              ? "default"
                              : lote.status === "REPROVADO"
                              ? "destructive"
                              : "secondary"
                          }
                          className="uppercase"
                        >
                          {lote.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{lote.quantidadeAmostras}</TableCell>
                      <TableCell>{lote.quantidadePecas}</TableCell>
                      <TableCell
                        className={`font-bold ${
                          lote.taxaAprovacao >= 90
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {lote.taxaAprovacao.toFixed(1)}%
                      </TableCell>
                      <TableCell>{/* Ações aqui */}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="estatisticas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Detalhadas</CardTitle>
              <CardDescription>
                Análise de desempenho ao longo do tempo (Mock data, conectar ao
                backend)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="font-semibold mb-2">
                    Taxa de Aprovação Mensal
                  </div>
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Gráfico aqui...
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="font-semibold mb-2">
                    Tempo Médio de Medição
                  </div>
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Gráfico aqui...
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DialogCriarLote
        open={dialogLoteAberto}
        setOpen={setDialogLoteAberto}
        tiposPecas={tiposPeca.map((t) => ({
          id: t.id,
          nome: t.nome,
          descricao: t.descricao,
        }))}
        onCriarLote={handleCriarLote}
      />
    </div>
  );
}

interface DialogCriarLoteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  tiposPecas: { id: number; nome: string; descricao: string }[];
  onCriarLote: (dados: {
    tipoPecaId: number;
    quantidade: number;
    descricao: string;
    quantidadeAmostras: number;
  }) => Promise<void>;
}

function DialogCriarLote({
  open,
  setOpen,
  tiposPecas,
  onCriarLote,
}: DialogCriarLoteProps) {
  // Estados iniciais em 0 para garantir que a validação falhe no início
  const [tipoPecaId, setTipoPecaId] = useState<string | number>("");
  const [quantidade, setQuantidade] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [quantidadeAmostras, setquantidadeAmostras] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tipoPecaSelecionado = tiposPecas.find(
    (t) => t.id === Number(tipoPecaId)
  );

  const handleSubmit = async () => {
    // Validação de BLINDAGEM: Se qualquer obrigatório for 0 ou "" (Não Válido)
    if (!tipoPecaId || quantidade <= 0 || quantidadeAmostras <= 0) {
      alert(
        "Por favor, preencha todos os campos obrigatórios com valores válidos (Tipo de Peça, Quantidade Total e Amostras Desejadas)."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const descricaoFinal =
        descricao.trim() || `Lote de ${tipoPecaSelecionado?.nome || "Peças"}`;

      await onCriarLote({
        tipoPecaId: Number(tipoPecaId),
        quantidade: quantidade,
        descricao: descricaoFinal,
        quantidadeAmostras: quantidadeAmostras,
      });

      // Reset
      setTipoPecaId("");
      setQuantidade(0);
      setDescricao("");
      setquantidadeAmostras(0);
    } catch (error) {
      console.error("Erro ao submeter criação de lote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Título necessário para acessibilidade */}
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Criar Novo Lote de Medição
          </DialogTitle>
          <DialogDescription>
            Informe os detalhes para iniciar o rastreamento de um novo lote de
            peças.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Tipo de Peça*
            </label>
            <Select value={String(tipoPecaId)} onValueChange={setTipoPecaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um Tipo de Peça existente" />
              </SelectTrigger>
              <SelectContent>
                {tiposPecas.map((tipo) => (
                  <SelectItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="descricao"
              className="text-sm font-medium leading-none"
            >
              Descrição do Lote
            </label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={`Ex: Lote de ${
                tipoPecaSelecionado?.nome || "Peças"
              } - 1ª remessa`}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="quantidade"
              className="text-sm font-medium leading-none"
            >
              Quantidade Total de Peças no Lote*
            </label>
            <Input
              id="quantidade"
              type="number"
              // CORREÇÃO: Exibe "" se o valor for 0 (Para iniciar vazio)
              value={quantidade === 0 ? "" : quantidade}
              onChange={(e) =>
                setQuantidade(
                  e.target.value === "" ? 0 : Number(e.target.value)
                )
              }
              min={1}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="amostras"
              className="text-sm font-medium leading-none"
            >
              Amostras Desejadas*
            </label>
            <Input
              id="amostras"
              type="number"
              // CORREÇÃO: Exibe "" se o valor for 0 (Para iniciar vazio)
              value={quantidadeAmostras === 0 ? "" : quantidadeAmostras}
              onChange={(e) =>
                setquantidadeAmostras(
                  e.target.value === "" ? 0 : Number(e.target.value)
                )
              }
              placeholder="Informe o número de amostras a medir"
              min={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            // O botão estará desabilitado se os estados forem "" ou 0
            disabled={
              !tipoPecaId ||
              quantidade <= 0 ||
              quantidadeAmostras <= 0 ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              "Criando..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Lote
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
