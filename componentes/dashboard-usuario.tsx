"use client";

import { useEffect, useState, useMemo } from "react";
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
  Ruler,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { useAutenticacao } from "@/contextos/contexto-autenticacao";
// [CORREÇÃO] Importando os tipos corretos
import {
  CriarLoteRequest,
  DashboardResponse,
  LoteResumidoResponse,
  TipoPecaResponse,
  useControleQualidadeApi,
} from "@/contextos/api/controlequalidade";
import { DialogCriarLote } from "./DialogCriarLote"; // Verifique se o caminho está correto

const DADOS_INICIAIS_DASHBOARD: DashboardResponse = {
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

  const [dashboardData, setDashboardData] = useState<DashboardResponse>(
    DADOS_INICIAIS_DASHBOARD
  );
  // [CORREÇÃO] Usando o tipo Omit para dados iniciais do lote
  const [dadosNovoLote] = useState<
    Partial<Omit<CriarLoteRequest, "codigoLote">>
  >({});

  const [lotesDoUsuario, setLotesDoUsuario] = useState<LoteResumidoResponse[]>(
    []
  );
  const [tiposPeca, setTiposPeca] = useState<TipoPecaResponse[]>([]);
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
        setError(err.message || "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    if (usuario) {
      fetchData();
    }
  }, [usuario, api]);

  const handleCriarLote = async (
    dadosLote: Omit<CriarLoteRequest, "codigoLote">
  ) => {
    try {
      // Gera o código do lote no frontend pouco antes de enviar
      const payload: CriarLoteRequest = {
        ...dadosLote,
      };
      console.log(dadosLote);
      await api.criarLote(payload);

      const [dashData, lotes] = await Promise.all([
        api.obterDashboard(),
        api.listarLotesDoUsuario(),
      ]);
      setDashboardData(dashData);
      setLotesDoUsuario(lotes);
    } catch (err: any) {
      console.error("Erro ao criar lote:", err);
      alert(err.message || "Não foi possível criar o lote.");
      throw err;
    }
  };

  const lotesFiltrados = useMemo(
    () =>
      lotesDoUsuario.filter((lote) => {
        const matchStatus =
          filtroStatus === "todos" || lote.status === filtroStatus;
        const matchBusca =
          lote.codigoLote.toLowerCase().includes(termoBusca.toLowerCase()) ||
          lote.tipoPeca.nome.toLowerCase().includes(termoBusca.toLowerCase());
        return matchStatus && matchBusca;
      }),
    [lotesDoUsuario, filtroStatus, termoBusca]
  );

  if (loading) {
    return <div className="p-6">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Erro: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard de Qualidade
          </h1>
          <p className="text-muted-foreground">
            {/* [CORREÇÃO] Usando 'username' que existe no DTO */}
            Bem-vindo(a), {usuario?.nome || "Usuário"}!
          </p>
        </div>
        <Button
          className="mt-4 sm:mt-0"
          onClick={() => setDialogLoteAberto(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Lote de Medição
        </Button>
      </header>
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="meus-lotes">Meus Lotes</TabsTrigger>
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
                <div className="text-2xl font-bold">
                  {dashboardData.totalLotes}
                </div>
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
                  {dashboardData.lotesEmAndamento}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Aprovação
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.taxaAprovacaoGeral.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio / Peça
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.tempoMedioMedicaoMinutos.toFixed(1)} min
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Lotes Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.lotesRecentes.slice(0, 4).map((lote) => {
                  const amostrasFeitas =
                    lote.pecasAprovadas + lote.pecasReprovadas;
                  const progresso =
                    lote.quantidadeAmostrasDesejada > 0
                      ? (amostrasFeitas / lote.quantidadeAmostrasDesejada) * 100
                      : 0;
                  return (
                    <div
                      key={lote.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">#{lote.codigoLote}</p>
                          <Badge variant="secondary" className="uppercase">
                            {lote.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {lote.tipoPeca.nome}
                        </p>
                      </div>
                      <div className="w-1/3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Amostras: {amostrasFeitas} de{" "}
                          {lote.quantidadeAmostrasDesejada}
                        </p>
                        <Progress value={progresso} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meus-lotes" className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou tipo de peça..."
                    className="pl-10"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                  />
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
                    <TableHead>Amostras Necessarias/Aprovadas</TableHead>
                    <TableHead>Qtd. Total</TableHead>
                    <TableHead>Aprovação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotesFiltrados.map((lote) => (
                    <TableRow key={lote.id}>
                      <TableCell className="font-medium">
                        #{lote.codigoLote}
                      </TableCell>
                      <TableCell>{lote.tipoPeca.nome}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lote.status === "REPROVADO"
                              ? "destructive"
                              : "secondary"
                          }
                          className="uppercase"
                        >
                          {lote.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lote.quantidadeAmostrasDesejada} /{" "}
                        {lote.pecasAprovadas}
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DialogCriarLote
        open={dialogLoteAberto}
        dadosIniciais={dadosNovoLote}
        setOpen={setDialogLoteAberto}
        tiposPecas={tiposPeca}
        onCriarLote={handleCriarLote}
      />
    </div>
  );
}
