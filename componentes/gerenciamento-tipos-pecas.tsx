"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Ruler,
  Save,
  Loader2,
} from "lucide-react";
import { useControleQualidadeApi } from "@/contextos/api/controlequalidade";

// [CORREÇÃO] Importando os tipos corretos, incluindo CotaMetadata
import {
  LoteResumidoResponse,
  TipoPecaResponse,
  CriarLoteRequest,
  CriarTipoPecaRequest,
  CotaMetadata, // <-- Usaremos este tipo para representar uma dimensão
} from "@/contextos/api/controlequalidade";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import DialogCriarLote from "./DialogCriarLote";
import { DialogTipoPeca } from "./DialogTipoPeca";

type TipoCampo = "number" | "text";

// --- COMPONENTE: DialogTipoPeca ---

interface DialogTipoPecaProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: CriarTipoPecaRequest;
  setFormData: React.Dispatch<React.SetStateAction<CriarTipoPecaRequest>>;
  novoCampo: CotaMetadata; // [CORREÇÃO] Usando CotaMetadata
  setNovoCampo: React.Dispatch<React.SetStateAction<CotaMetadata>>; // [CORREÇÃO] Usando CotaMetadata
  adicionarCampo: () => void;
  removerCampo: (index: number) => void;
  onSalvoComSucesso: () => void;
  tipoPecaIdParaEdicao?: number | string | null;
}

// --- COMPONENTE PRINCIPAL ---
export function GerenciamentoLotesEPecas() {
  const api = useControleQualidadeApi();

  const [tiposPecas, setTiposPecas] = useState<TipoPecaResponse[]>([]);
  const [lotes, setLotes] = useState<LoteResumidoResponse[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");

  const [dialogLoteAberto, setDialogLoteAberto] = useState(false);
  const [dialogTipoAberto, setDialogTipoAberto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoPecaResponse | null>(
    null
  );

  const [formDataTipoPeca, setFormDataTipoPeca] =
    useState<CriarTipoPecaRequest>({
      nome: "",
      descricao: "",
      dimensoes: [],
    });

  // [CORREÇÃO] O estado para um novo campo agora usa o tipo CotaMetadata
  const [novoCampo, setNovoCampo] = useState<CotaMetadata>({
    nome: "",
    label: "",
    tipo: "number",
    unidade: "mm",
  });

  const adicionarCampo = () => {
    if (!novoCampo.nome || !novoCampo.label) return;
    const nomeFmt = novoCampo.nome.toLowerCase().replace(/\s+/g, "");
    if (formDataTipoPeca.dimensoes.some((d) => d.nome === nomeFmt)) {
      toast({
        title: "Campo Duplicado",
        description: `O nome (chave) "${nomeFmt}" já existe.`,
        variant: "destructive",
      });
      return;
    }
    setFormDataTipoPeca((p) => ({
      ...p,
      dimensoes: [...p.dimensoes, { ...novoCampo, nome: nomeFmt }],
    }));
    setNovoCampo({ nome: "", label: "", tipo: "number", unidade: "mm" });
  };

  const removerCampo = (index: number) => {
    setFormDataTipoPeca((p) => ({
      ...p,
      dimensoes: p.dimensoes.filter((_, i) => i !== index),
    }));
  };

  const recarregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const [tipos, lotesData] = await Promise.all([
        api.listarTiposPeca(),
        api.listarTodosOsLotes(),
      ]);
      setTiposPecas(tipos);
      setLotes(lotesData);
    } catch (error: any) {
      toast({
        title: "Erro ao Carregar Dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    recarregarDados();
  }, [recarregarDados]);

  const criarLoteAPI = async (data: CriarLoteRequest) => {
    try {
      await api.criarLote(data);
      toast({ title: "Sucesso", description: "Novo lote criado." });
      await recarregarDados();
    } catch (error: any) {
      toast({
        title: "Erro ao Criar Lote",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const abrirNovoLote = () => {
    setDialogLoteAberto(true);
  };

  const abrirNovoTipo = () => {
    setTipoEditando(null);
    setFormDataTipoPeca({ nome: "", descricao: "", dimensoes: [] });
    setNovoCampo({ nome: "", label: "", tipo: "number", unidade: "mm" });
    setDialogTipoAberto(true);
  };

  const abrirEdicaoTipo = (tipo: TipoPecaResponse) => {
    setTipoEditando(tipo);
    setFormDataTipoPeca({
      nome: tipo.nome,
      descricao: tipo.descricao,
      dimensoes: tipo.metadadosCotas.map((c) => ({
        ...c,
        tipo: c.tipo === "number" ? "number" : "text",
      })),
    });
    setDialogTipoAberto(true);
  };

  const lotesFiltrados = lotes.filter(
    (l) =>
      l.codigoLote.toLowerCase().includes(termoBusca.toLowerCase()) ||
      l.descricao.toLowerCase().includes(termoBusca.toLowerCase()) ||
      l.tipoPeca.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const tiposFiltrados = tiposPecas.filter(
    (t) =>
      t.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      t.descricao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Lotes e Peças</h1>
          <p className="text-muted-foreground">
            Configure e gerencie os tipos de peças e lotes de produção.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={abrirNovoLote}>
            <Package className="h-4 w-4 mr-2" />
            Criar Lote
          </Button>
          <Button onClick={abrirNovoTipo} variant="outline">
            <Ruler className="h-4 w-4 mr-2" />
            Novo Tipo de Peça
          </Button>
        </div>
      </div>

      <Tabs defaultValue="lotes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lotes">Lotes ({lotes.length})</TabsTrigger>
          <TabsTrigger value="lista-pecas">
            Tipos de Peças ({tiposPecas.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lotes de Produção</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lote..."
                  className="pl-8"
                  onChange={(e) => setTermoBusca(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <p>Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Peça</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Peças</TableHead>
                      <TableHead>AmostrasDesejadas/Aprovadas</TableHead>
                      <TableHead>% Aprov.</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotesFiltrados.map((lote) => (
                      <TableRow key={lote.id}>
                        <TableCell className="font-medium">
                          {lote.codigoLote}
                        </TableCell>
                        <TableCell>{lote.tipoPeca.nome}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lote.status === "REPROVADO"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {lote.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{lote.quantidadePecas}</TableCell>
                        <TableCell>
                          {lote.quantidadeAmostrasDesejada} /{" "}
                          {lote.pecasAprovadas}
                        </TableCell>
                        <TableCell
                          className={`font-bold ${
                            lote.taxaAprovacao >= 90
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {lote.taxaAprovacao.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Search className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lista-pecas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Peças</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tipo de peça..."
                  className="pl-8"
                  onChange={(e) => setTermoBusca(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <p>Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Dimensões</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiposFiltrados.map((tipo) => (
                      <TableRow key={tipo.id}>
                        <TableCell className="font-medium">
                          {tipo.nome}
                        </TableCell>
                        <TableCell>{tipo.descricao || "-"}</TableCell>
                        <TableCell>{tipo.metadadosCotas.length}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicaoTipo(tipo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dialogLoteAberto && (
        <DialogCriarLote
          open={dialogLoteAberto}
          setOpen={setDialogLoteAberto}
          dadosIniciais={{}}
          tiposPecas={tiposPecas}
          onCriarLote={criarLoteAPI}
        />
      )}
      {dialogTipoAberto && (
        <DialogTipoPeca
          open={dialogTipoAberto}
          setOpen={setDialogTipoAberto}
          formData={formDataTipoPeca}
          setFormData={setFormDataTipoPeca}
          novoCampo={novoCampo}
          setNovoCampo={setNovoCampo}
          adicionarCampo={adicionarCampo}
          removerCampo={removerCampo}
          onSalvoComSucesso={() => {
            recarregarDados();
            setDialogTipoAberto(false);
          }}
          tipoPecaIdParaEdicao={tipoEditando?.id}
        />
      )}
    </div>
  );
}
