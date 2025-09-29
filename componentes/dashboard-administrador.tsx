"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Adicionado para o formulário
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Ruler,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Search,
  Filter,
  Layers,
  Plus,
  Loader2,
  RotateCw,
} from "lucide-react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import { useDashboardData } from "../hooks/useDashboardData"; // Seu Hook Principal
import {
  Dialog as UIDialog, // Renomeado para evitar conflito com Radix import
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useControleQualidadeApi,
  TipoPecaAPI,
} from "@/contextos/api/controlequalidade";
import { toast } from "sonner";

// --- FUNÇÕES AUXILIARES (mantidas) ---

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    ativo: {
      label: "Ativo",
      variant: "default" as const,
      color: "text-green-600",
    },
    inativo: {
      label: "Inativo",
      variant: "secondary" as const,
      color: "text-gray-600",
    },
    bloqueado: {
      label: "Bloqueado",
      variant: "destructive" as const,
      color: "text-red-600",
    },
  };
  const config = configs[status as keyof typeof configs] || configs.inativo;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function SeveridadeBadge({ severidade }: { severidade: string }) {
  const configs = {
    alta: { label: "Alta", variant: "destructive" as const, icon: XCircle },
    media: {
      label: "Média",
      variant: "secondary" as const,
      icon: AlertTriangle,
    },
    baixa: { label: "Baixa", variant: "outline" as const, icon: CheckCircle },
  };
  const config = configs[severidade as keyof typeof configs] || configs.baixa;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ----------------------------------------------------------------------------------
// --- COMPONENTE AUXILIAR: DialogCriarLote ---
// ----------------------------------------------------------------------------------

interface DialogCriarLoteProps {
  tiposPecas: TipoPecaAPI[];
  carregandoTiposPecas: boolean;
  erroTiposPecas: string | null;
  recarregarTiposPecas: () => void;
  onLoteCriado: () => void;
}

function DialogCriarLote({
  tiposPecas,
  carregandoTiposPecas,
  erroTiposPecas,
  recarregarTiposPecas,
  onLoteCriado,
}: DialogCriarLoteProps) {
  const api = useControleQualidadeApi();
  const [open, setOpen] = useState(false);
  const [tipoPecaId, setTipoPecaId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [quantidadeAmostras, setQuantidadeAmostras] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipoPecaId || !quantidade || !quantidadeAmostras) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Aqui você faria a chamada real para a API de criação de lote.
      // Assumindo que o endpoint é api.criarLote({ ... })

      // Chamada de API MOCK para o exemplo
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Lote Criado (MOCK):", {
        tipoPecaId: Number(tipoPecaId),
        quantidade: Number(quantidade),
        quantidadeAmostras: Number(quantidadeAmostras),
        descricao,
      });

      toast.success("Novo lote de produção criado com sucesso!");
      setOpen(false);
      onLoteCriado(); // Recarrega os dados do dashboard
    } catch (error) {
      console.error("Erro ao criar lote:", error);
      toast.error("Falha ao criar lote. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIDialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Lote</DialogTitle>
          <DialogDescription>
            Defina as especificações do lote de peças a ser inspecionado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipoPeca" className="text-right">
              Tipo de Peça*
            </Label>
            <Select onValueChange={setTipoPecaId} value={tipoPecaId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o Tipo" />
              </SelectTrigger>
              <SelectContent>
                {carregandoTiposPecas && (
                  <SelectItem value="" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Carregando Tipos...
                  </SelectItem>
                )}
                {erroTiposPecas && (
                  <SelectItem value="" disabled>
                    Erro ao carregar tipos
                  </SelectItem>
                )}
                {tiposPecas.map((tipo) => (
                  <SelectItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantidade" className="text-right">
              Qtd. Peças*
            </Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="col-span-3"
              min="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amostras" className="text-right">
              Qtd. Amostras*
            </Label>
            <Input
              id="amostras"
              type="number"
              value={quantidadeAmostras}
              onChange={(e) => setQuantidadeAmostras(e.target.value)}
              className="col-span-3"
              min="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descricao" className="text-right">
              Descrição
            </Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Lote da Linha 3 - 2º Turno"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Lote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </UIDialog>
  );
}

// ----------------------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL: DashboardAdministrador ---
// ----------------------------------------------------------------------------------

export function DashboardAdministrador() {
  const { usuario } = useAutenticacao();

  const {
    estatisticas,
    usuarios,
    alertas,
    tiposPecas,
    carregandoTiposPecas,
    erroTiposPecas,
    recarregarTiposPecas,
    recarregarDashboard,
    carregandoUsuarios,
    erroUsuarios,
    recarregarUsuarios,
  } = useDashboardData();

  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  // Filtra usuários baseado nos filtros aplicados
  const usuariosFiltrados = useMemo(() => {
    if (!usuarios) return [];
    return usuarios.filter((user) => {
      const matchStatus =
        filtroUsuario === "todos"; /* || user.status === filtroUsuario; */
      const matchBusca =
        user.username.toLowerCase().includes(termoBusca.toLowerCase()) ||
        user.email.toLowerCase().includes(termoBusca.toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [usuarios, filtroUsuario, termoBusca]);

  // Dados estáticos de exemplo para Distribuição de Peças (Mantidos como MOCK)
  const medicoesPorTipoMock = [
    {
      tipo: "Eixo de Transmissão (API Mock)",
      quantidade: 312,
      porcentagem: 25.0,
      aprovacao: 94.2,
    },
    {
      tipo: "Engrenagem (API Mock)",
      quantidade: 287,
      porcentagem: 23.0,
      aprovacao: 96.1,
    },
    {
      tipo: "Parafuso M8 (API Mock)",
      quantidade: 234,
      porcentagem: 18.8,
      aprovacao: 98.3,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral e gerenciamento do sistema, **{usuario?.nome}**
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Relatório Geral
          </Button>

          {/* Botão para abrir o Dialog de Criar Lote */}
          <DialogCriarLote
            tiposPecas={tiposPecas}
            carregandoTiposPecas={carregandoTiposPecas}
            erroTiposPecas={erroTiposPecas}
            recarregarTiposPecas={recarregarTiposPecas}
            onLoteCriado={recarregarDashboard}
          />
        </div>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 justify-center">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
          {/*  <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="cadastros">**Cadastros**</TabsTrigger> */}
        </TabsList>

        {/* Aba: Visão Geral (Sem alteração) */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuários Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticas.usuariosAtivos}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {estatisticas.totalUsuarios} usuários
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Medições Hoje
                </CardTitle>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticas.medicoesHoje}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />+
                  {estatisticas.tendenciaSemanal}% esta semana
                </p>
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
                  {estatisticas.taxaAprovacaoGeral}%
                </div>
                <p className="text-xs text-muted-foreground">Meta: 95%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticas.tempoMedioGeral}min
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  -0.2min desde semana passada
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Meta Mensal do Sistema</CardTitle>
              <CardDescription>
                Progresso geral em relação à meta de {estatisticas.metaMensal}{" "}
                medições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{estatisticas.totalMedicoes} medições</span>
                  <span>{estatisticas.progressoMeta}% da meta</span>
                </div>
                <Progress value={estatisticas.progressoMeta} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Faltam {estatisticas.metaMensal - estatisticas.totalMedicoes}{" "}
                  medições para atingir a meta
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/*  <Card>
              <CardHeader>
                <CardTitle>Melhores Performers</CardTitle>
                <CardDescription>
                  Usuários com melhor desempenho este mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usuarios
                    .sort((a, b) => b.taxaAprovacao - a.taxaAprovacao)
                    .slice(0, 3)
                    .map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.username
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{user.username}</p>
                          { <p className="text-xs text-muted-foreground">
                            {user.medicoes} medições
                          </p> }
                        </div>
                        {<div className="text-right">
                          <p className="font-medium text-sm">
                            {user.taxaAprovacao}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            aprovação
                          </p>
                        </div> }
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card> */}

            {/*  <Card>
              <CardHeader>
                <CardTitle>Alertas de Qualidade</CardTitle>
                <CardDescription>
                  Problemas que requerem atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertas.slice(0, 3).map((alerta) => (
                    <div key={alerta.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm">{alerta.tipo}</p>
                        <SeveridadeBadge severidade={alerta.severidade} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {alerta.descricao}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{alerta.usuario}</span>
                        <span>{alerta.dataHora}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>
        </TabsContent>

        {/* Aba: Usuários (Com Lógica de Carregamento e Erro) */}
        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                    <SelectItem value="bloqueado">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
                {/* Botão de Recarregar Usuários */}
                <Button
                  variant="outline"
                  onClick={recarregarUsuarios}
                  disabled={carregandoUsuarios}
                  title="Recarregar Lista de Usuários"
                >
                  {carregandoUsuarios ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                {carregandoUsuarios
                  ? "Carregando usuários..."
                  : erroUsuarios
                  ? "Erro ao carregar usuários."
                  : `${usuariosFiltrados.length} usuários encontrados`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Condicional de Carregamento/Erro/Dados */}
              {carregandoUsuarios && (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-primary">Buscando usuários...</p>
                </div>
              )}

              {erroUsuarios && !carregandoUsuarios && (
                <div className="flex flex-col justify-center items-center h-48 text-red-600">
                  <XCircle className="h-8 w-8 mb-2" />
                  <p>
                    Falha ao carregar a lista de usuários. Mensagem: **
                    {erroUsuarios}**
                  </p>
                  <Button variant="link" onClick={recarregarUsuarios}>
                    Tentar novamente
                  </Button>
                </div>
              )}

              {!carregandoUsuarios && !erroUsuarios && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Medições</TableHead>
                      <TableHead>Taxa Aprovação</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum usuário encontrado com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuariosFiltrados.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {user.username
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {user.username}
                                </p>
                                {/*  <p className="text-xs text-muted-foreground">
                                  {user.tipo}
                                </p> */}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.email}
                          </TableCell>
                          {/* <TableCell className="text-sm font-medium">
                            {user.medicoes}
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.taxaAprovacao}%
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.ultimaAtividade}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={user.status} />
                          </TableCell> */}
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Qualidade (Sem alteração) */}
        <TabsContent value="qualidade" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Medições por Tipo de Peça</CardTitle>
                <CardDescription>
                  Distribuição e taxa de aprovação por tipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicoesPorTipoMock.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.tipo}</span>
                        <span className="text-muted-foreground">
                          {item.quantidade} medições
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={item.porcentagem}
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground w-12">
                          {item.porcentagem}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Taxa de aprovação: {item.aprovacao}%</span>
                        <span
                          className={
                            item.aprovacao >= 95
                              ? "text-green-600"
                              : item.aprovacao >= 90
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {item.aprovacao >= 95
                            ? "Excelente"
                            : item.aprovacao >= 90
                            ? "Bom"
                            : "Atenção"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Todos os Alertas</CardTitle>
                <CardDescription>
                  Monitoramento de qualidade em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertas.map((alerta) => (
                    <div key={alerta.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm">{alerta.tipo}</p>
                        <SeveridadeBadge severidade={alerta.severidade} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {alerta.descricao}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Usuário: {alerta.usuario}</span>
                        <span>{alerta.dataHora}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                        >
                          Investigar
                        </Button>
                        <Button variant="ghost" size="sm">
                          Marcar como Resolvido
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Cadastros (Redireciona para o DialogCriarLote) */}
        <TabsContent value="cadastros" className="space-y-6">
          <h2 className="text-2xl font-semibold">Ferramentas de Cadastro</h2>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Gerenciar Lotes
              </CardTitle>
              <CardDescription>
                Crie novos lotes de produção para iniciar o processo de
                inspeção.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A listagem de **Tipos de Peça** para o cadastro de lote é
                  buscada em tempo real da API:
                </p>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={recarregarTiposPecas}
                    disabled={carregandoTiposPecas}
                    variant="outline"
                  >
                    {carregandoTiposPecas ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Recarregar Tipos de Peça</span>
                  </Button>
                  {erroTiposPecas && (
                    <Badge variant="destructive">Erro: {erroTiposPecas}</Badge>
                  )}
                  {!carregandoTiposPecas && !erroTiposPecas && (
                    <Badge variant="secondary">
                      {tiposPecas.length} Tipos carregados
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
