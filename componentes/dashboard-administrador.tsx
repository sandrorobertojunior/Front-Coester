"use client";

import { useState } from "react";
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
  Settings,
  BarChart3,
  Activity,
} from "lucide-react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";

// Dados simulados para o dashboard administrativo
const estatisticasGerais = {
  totalUsuarios: 12,
  usuariosAtivos: 8,
  totalMedicoes: 1248,
  medicoesHoje: 47,
  taxaAprovacaoGeral: 94.8,
  tempoMedioGeral: 3.4,
  tendenciaSemanal: 12.3,
  metaMensal: 1500,
  progressoMeta: 83.2,
};

const usuariosMock = [
  {
    id: "1",
    nome: "João Silva",
    email: "joao@empresa.com",
    tipo: "usuario",
    medicoes: 248,
    taxaAprovacao: 95.2,
    ultimaAtividade: "2024-01-15 14:30",
    status: "ativo",
  },
  {
    id: "2",
    nome: "Maria Santos",
    email: "maria@empresa.com",
    tipo: "usuario",
    medicoes: 186,
    taxaAprovacao: 97.1,
    ultimaAtividade: "2024-01-15 13:45",
    status: "ativo",
  },
  {
    id: "3",
    nome: "Pedro Costa",
    email: "pedro@empresa.com",
    tipo: "usuario",
    medicoes: 142,
    taxaAprovacao: 92.8,
    ultimaAtividade: "2024-01-15 12:20",
    status: "ativo",
  },
  {
    id: "4",
    nome: "Ana Oliveira",
    email: "ana@empresa.com",
    tipo: "usuario",
    medicoes: 98,
    taxaAprovacao: 96.4,
    ultimaAtividade: "2024-01-14 16:15",
    status: "inativo",
  },
];

const medicoesPorTipo = [
  {
    tipo: "Eixo de Transmissão",
    quantidade: 312,
    porcentagem: 25.0,
    aprovacao: 94.2,
  },
  { tipo: "Engrenagem", quantidade: 287, porcentagem: 23.0, aprovacao: 96.1 },
  { tipo: "Parafuso M8", quantidade: 234, porcentagem: 18.8, aprovacao: 98.3 },
  { tipo: "Bucha", quantidade: 198, porcentagem: 15.9, aprovacao: 91.4 },
  { tipo: "Porca M8", quantidade: 156, porcentagem: 12.5, aprovacao: 95.5 },
  { tipo: "Outros", quantidade: 61, porcentagem: 4.8, aprovacao: 89.2 },
];

const alertasQualidade = [
  {
    id: "1",
    tipo: "Taxa de Reprovação Alta",
    descricao: "Engrenagens com 8.2% de reprovação esta semana",
    severidade: "alta",
    usuario: "Pedro Costa",
    dataHora: "2024-01-15 10:30",
  },
  {
    id: "2",
    tipo: "Tempo de Medição Elevado",
    descricao: "Tempo médio de medição aumentou 15% para Eixos",
    severidade: "media",
    usuario: "João Silva",
    dataHora: "2024-01-15 09:15",
  },
  {
    id: "3",
    tipo: "Usuário Inativo",
    descricao: "Ana Oliveira sem atividade há 24 horas",
    severidade: "baixa",
    usuario: "Ana Oliveira",
    dataHora: "2024-01-14 16:15",
  },
];

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

export function DashboardAdministrador() {
  const { usuario } = useAutenticacao();
  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  // Filtra usuários baseado nos filtros aplicados
  const usuariosFiltrados = usuariosMock.filter((user) => {
    const matchStatus =
      filtroUsuario === "todos" || user.status === filtroUsuario;
    const matchBusca =
      user.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      user.email.includes(termoBusca);
    return matchStatus && matchBusca;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral e gerenciamento do sistema, {usuario?.nome}
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
          <Button className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        </div>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* Cards de Estatísticas Principais */}
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
                  {estatisticasGerais.usuariosAtivos}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {estatisticasGerais.totalUsuarios} usuários
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
                  {estatisticasGerais.medicoesHoje}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />+
                  {estatisticasGerais.tendenciaSemanal}% esta semana
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
                  {estatisticasGerais.taxaAprovacaoGeral}%
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
                  {estatisticasGerais.tempoMedioGeral}min
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  -0.2min desde semana passada
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progresso da Meta Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Meta Mensal do Sistema</CardTitle>
              <CardDescription>
                Progresso geral em relação à meta de{" "}
                {estatisticasGerais.metaMensal} medições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{estatisticasGerais.totalMedicoes} medições</span>
                  <span>{estatisticasGerais.progressoMeta}% da meta</span>
                </div>
                <Progress
                  value={estatisticasGerais.progressoMeta}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Faltam{" "}
                  {estatisticasGerais.metaMensal -
                    estatisticasGerais.totalMedicoes}{" "}
                  medições para atingir a meta
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Melhores Performers</CardTitle>
                <CardDescription>
                  Usuários com melhor desempenho este mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usuariosMock
                    .sort((a, b) => b.taxaAprovacao - a.taxaAprovacao)
                    .slice(0, 3)
                    .map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.nome
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{user.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.medicoes} medições
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {user.taxaAprovacao}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            aprovação
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Alertas de Qualidade */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Qualidade</CardTitle>
                <CardDescription>
                  Problemas que requerem atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertasQualidade.slice(0, 3).map((alerta) => (
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
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Usuários */}
        <TabsContent value="usuarios" className="space-y-6">
          {/* Filtros e Busca */}
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
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                {usuariosFiltrados.length} usuários encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {usuariosFiltrados.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.nome
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.tipo}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm font-medium">
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
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Qualidade */}
        <TabsContent value="qualidade" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Tipo de Peça */}
            <Card>
              <CardHeader>
                <CardTitle>Medições por Tipo de Peça</CardTitle>
                <CardDescription>
                  Distribuição e taxa de aprovação por tipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicoesPorTipo.map((item, index) => (
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

            {/* Alertas Detalhados */}
            <Card>
              <CardHeader>
                <CardTitle>Todos os Alertas</CardTitle>
                <CardDescription>
                  Monitoramento de qualidade em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertasQualidade.map((alerta) => (
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

        {/* Aba: Relatórios */}
        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                titulo: "Relatório de Produtividade",
                descricao:
                  "Análise detalhada da produtividade por usuário e período",
                icone: BarChart3,
              },
              {
                titulo: "Relatório de Qualidade",
                descricao:
                  "Estatísticas de aprovação e reprovação por tipo de peça",
                icone: CheckCircle,
              },
              {
                titulo: "Relatório de Performance",
                descricao: "Tempos de medição e eficiência operacional",
                icone: Activity,
              },
              {
                titulo: "Relatório de Usuários",
                descricao: "Atividade e desempenho individual dos operadores",
                icone: Users,
              },
              {
                titulo: "Relatório de Tendências",
                descricao: "Análise de tendências e previsões de qualidade",
                icone: TrendingUp,
              },
              {
                titulo: "Relatório Personalizado",
                descricao:
                  "Crie relatórios customizados com filtros específicos",
                icone: Settings,
              },
            ].map((relatorio, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <relatorio.icone className="h-5 w-5 text-primary" />
                    {relatorio.titulo}
                  </CardTitle>
                  <CardDescription>{relatorio.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
