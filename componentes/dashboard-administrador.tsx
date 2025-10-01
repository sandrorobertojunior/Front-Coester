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
  Loader2,
  RotateCw,
} from "lucide-react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import { useDashboardData } from "../hooks/useDashboardData"; // Seu Hook Principal
import { DialogCriarLote } from "./DialogCriarLote"; // Importando o diálogo separado

// --- FUNÇÕES AUXILIARES ---

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

// --- COMPONENTE PRINCIPAL ---
export function DashboardAdministrador() {
  const { usuario } = useAutenticacao();
  const {
    dashboard, // Usando o objeto dashboard do hook
    usuarios,
    tiposPecas,
    carregando, // Usando o loading geral
    erro, // Usando o erro geral
    recarregarDashboard,
  } = useDashboardData();

  const [abaAtiva, setAbaAtiva] = useState("visao-geral");
  const [termoBusca, setTermoBusca] = useState("");

  const usuariosFiltrados = useMemo(() => {
    if (!usuarios) return [];
    return usuarios.filter((user) => {
      const nome = user.username || "";
      const email = user.email || "";
      return (
        nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        email.toLowerCase().includes(termoBusca.toLowerCase())
      );
    });
  }, [usuarios, termoBusca]);

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando painel...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-red-600">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <p className="font-bold">Erro ao carregar o painel</p>
        <p className="text-sm mb-4">{erro}</p>
        <Button onClick={recarregarDashboard}>Tentar Novamente</Button>
      </div>
    );
  }

  // Se dashboard for nulo após o carregamento, mostra um estado de erro/vazio
  if (!dashboard) {
    return <div>Não foi possível carregar os dados do dashboard.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral e gerenciamento do sistema, {usuario?.nome}
          </p>
        </div>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 justify-center">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lotes em Andamento
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard.lotesEmAndamento}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {dashboard.totalLotes} lotes totais
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
                  {dashboard.taxaAprovacaoGeral.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Meta: 95%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio de Medição
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard.tempoMedioMedicaoMinutos.toFixed(1)} min
                </div>
                <p className="text-xs text-muted-foreground">por amostra</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usuarios.length}</div>
                <p className="text-xs text-muted-foreground">
                  usuários cadastrados
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

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

                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhum usuário encontrado.
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
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm">
                              {user.username}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
