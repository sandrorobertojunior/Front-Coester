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
import {
  Ruler,
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Download,
} from "lucide-react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";

// Dados simulados para demonstração
const medicoesMock = [
  {
    id: "001",
    tipoPeca: "Eixo de Transmissão",
    dimensoes: { comprimento: 150.2, diametro: 25.1, tolerancia: 0.1 },
    status: "aprovada",
    operador: "João Silva",
    dataHora: "2024-01-15 14:30",
    observacoes: "Peça dentro das especificações",
  },
  {
    id: "002",
    tipoPeca: "Engrenagem",
    dimensoes: { diametro: 80.5, espessura: 12.0, tolerancia: 0.05 },
    status: "reprovada",
    operador: "João Silva",
    dataHora: "2024-01-15 13:15",
    observacoes: "Diâmetro fora da tolerância",
  },
  {
    id: "003",
    tipoPeca: "Parafuso M8",
    dimensoes: { comprimento: 40.0, diametro: 8.0, tolerancia: 0.02 },
    status: "aprovada",
    operador: "João Silva",
    dataHora: "2024-01-15 12:45",
    observacoes: "Conforme especificação",
  },
  {
    id: "004",
    tipoPeca: "Bucha",
    dimensoes: {
      diametroInterno: 15.0,
      diametroExterno: 25.0,
      tolerancia: 0.03,
    },
    status: "revisao",
    operador: "João Silva",
    dataHora: "2024-01-15 11:20",
    observacoes: "Necessita verificação adicional",
  },
];

const estatisticasMock = {
  totalMedicoes: 248,
  medicoesHoje: 12,
  taxaAprovacao: 95.2,
  tempoMedio: 3.2,
  tendenciaSemanal: 8.5,
  metaMensal: 300,
  progressoMeta: 82.7,
};

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    aprovada: {
      label: "Aprovada",
      variant: "default" as const,
      icon: CheckCircle,
      color: "text-green-600",
    },
    reprovada: {
      label: "Reprovada",
      variant: "destructive" as const,
      icon: XCircle,
      color: "text-red-600",
    },
    revisao: {
      label: "Em Revisão",
      variant: "secondary" as const,
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
  };

  const config = configs[status as keyof typeof configs] || configs.revisao;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function DashboardUsuario() {
  const { usuario } = useAutenticacao();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  // Filtra medições baseado nos filtros aplicados
  const medicoesFiltradas = medicoesMock.filter((medicao) => {
    const matchStatus =
      filtroStatus === "todos" || medicao.status === filtroStatus;
    const matchBusca =
      medicao.tipoPeca.toLowerCase().includes(termoBusca.toLowerCase()) ||
      medicao.id.includes(termoBusca);
    return matchStatus && matchBusca;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard do Usuário
          </h1>
          <p className="text-muted-foreground">
            Acompanhe suas medições e estatísticas, {usuario?.nome}
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Medição
        </Button>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="medicoes">Minhas Medições</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Medições Hoje
                </CardTitle>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticasMock.medicoesHoje}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  +2 desde ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total do Mês
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticasMock.totalMedicoes}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />+
                  {estatisticasMock.tendenciaSemanal}% esta semana
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
                  {estatisticasMock.taxaAprovacao}%
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
                  {estatisticasMock.tempoMedio}min
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  -0.3min desde semana passada
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progresso da Meta Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Meta Mensal</CardTitle>
              <CardDescription>
                Progresso em relação à meta de {estatisticasMock.metaMensal}{" "}
                medições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{estatisticasMock.totalMedicoes} medições</span>
                  <span>{estatisticasMock.progressoMeta}% da meta</span>
                </div>
                <Progress
                  value={estatisticasMock.progressoMeta}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Faltam{" "}
                  {estatisticasMock.metaMensal - estatisticasMock.totalMedicoes}{" "}
                  medições para atingir a meta
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Medições Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Medições Recentes</CardTitle>
              <CardDescription>
                Suas últimas 4 medições registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {medicoesMock.slice(0, 4).map((medicao) => (
                  <div
                    key={medicao.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">#{medicao.id}</p>
                        <StatusBadge status={medicao.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {medicao.tipoPeca}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {medicao.dataHora}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Minhas Medições */}
        <TabsContent value="medicoes" className="space-y-6">
          {/* Filtros e Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre e busque suas medições</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por tipo de peça ou ID..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="pl-10"
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
                    <SelectItem value="aprovada">Aprovadas</SelectItem>
                    <SelectItem value="reprovada">Reprovadas</SelectItem>
                    <SelectItem value="revisao">Em Revisão</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Medições */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Medições</CardTitle>
              <CardDescription>
                {medicoesFiltradas.length} medições encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo de Peça</TableHead>
                    <TableHead>Dimensões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicoesFiltradas.map((medicao) => (
                    <TableRow key={medicao.id}>
                      <TableCell className="font-medium">
                        #{medicao.id}
                      </TableCell>
                      <TableCell>{medicao.tipoPeca}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Object.entries(medicao.dimensoes).map(
                            ([key, value]) => (
                              <div key={key}>
                                {key}: {value}mm
                              </div>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={medicao.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {medicao.dataHora}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                        {medicao.observacoes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Aprovadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">236</span>
                      <span className="text-xs text-muted-foreground">
                        (95.2%)
                      </span>
                    </div>
                  </div>
                  <Progress value={95.2} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Reprovadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">8</span>
                      <span className="text-xs text-muted-foreground">
                        (3.2%)
                      </span>
                    </div>
                  </div>
                  <Progress value={3.2} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Em Revisão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">4</span>
                      <span className="text-xs text-muted-foreground">
                        (1.6%)
                      </span>
                    </div>
                  </div>
                  <Progress value={1.6} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Peças Mais Medidas */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos Mais Medidos</CardTitle>
                <CardDescription>Top 5 tipos de peças</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      tipo: "Eixo de Transmissão",
                      quantidade: 45,
                      porcentagem: 18.1,
                    },
                    { tipo: "Engrenagem", quantidade: 38, porcentagem: 15.3 },
                    { tipo: "Parafuso M8", quantidade: 32, porcentagem: 12.9 },
                    { tipo: "Bucha", quantidade: 28, porcentagem: 11.3 },
                    { tipo: "Porca M8", quantidade: 24, porcentagem: 9.7 },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantidade} medições
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {item.porcentagem}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
