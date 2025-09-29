"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Copy,
  X,
  CheckCircle,
  Save,
  Trash2,
  Package,
  AlertTriangle,
  Ruler,
} from "lucide-react";

// 💡 ASSUMINDO CONTEXTOS E TIPOS DE API
import { useAutenticacao, Usuario } from "@/contextos/contexto-autenticacao";
import {
  useControleQualidadeApi,
  LoteResumidoAPI,
  TipoPecaAPI,
  CriarLoteRequestData,
  CotaMetadataAPI,
} from "@/contextos/api/controlequalidade"; // Assumindo este caminho

// Importação dos componentes ShadCN UI (assumidos)
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DialogTipoPeca,
  Dimensao,
  TipoPeca,
  TipoPecaFormData,
} from "./DialogTipoPeca";

// --- TIPOS E INTERFACES DO COMPONENTE (Mapeamento de UI) ---

type TipoCampo = "number" | "text";

interface CampoMedicao {
  nome: string;
  label: string;
  tipo: TipoCampo;
  obrigatorio: boolean;
  unidade?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface Especificacao {
  valorNominal: number;
  tolerancia: number;
}

interface TipoPecaLote {
  id: number;
  nome: string;
  descricao: string;
}

interface Lote extends LoteResumidoAPI {
  // Propriedades adicionadas para forçar a compatibilidade da UI com a API
  tipoPecaId: number;
  pecasAprovadas: number;
  pecasReprovadas: number;
  taxaAprovacao: number;
  descricao: string;
  dataCriacao: string;
  criadoPor: string;
  tipoPeca: TipoPecaLote;
}

// --- DIALOGO DE CRIAÇÃO DE LOTE ---

interface DialogCriarLoteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dadosIniciais: Partial<
    Omit<
      Lote,
      | "id"
      | "status"
      | "criadoEm"
      | "criadoPor"
      | "dataCriacao"
      | "tipoPecaId"
      | "tipoPecaNome"
      | "pecasAprovadas"
      | "pecasReprovadas"
      | "taxaAprovacao"
    >
  >;
  tiposPecas: TipoPeca[]; // Para o dropdown de seleção
  onCriarLote: (
    lote: Omit<
      Lote,
      | "id"
      | "status"
      | "taxaAprovacao"
      | "pecasAprovadas"
      | "pecasReprovadas"
      | "porcentagemAmostragem"
      | "criadoEm"
      | "criadoPor"
      | "dataCriacao"
      | "tipoPecaNome"
    >
  ) => Promise<void>;
}

function DialogCriarLote({
  open,
  setOpen,
  dadosIniciais,
  tiposPecas,
  onCriarLote,
}: DialogCriarLoteProps) {
  const [formDataLote, setFormDataLote] = useState(() => ({
    codigoLote: dadosIniciais.codigoLote || "",
    descricao: dadosIniciais.descricao || "",
    tipoPecaId: dadosIniciais.tipoPeca?.id?.toString() || "",
    quantidadePecas: dadosIniciais.quantidadePecas || 0,
    quantidadeAmostrasDesejada: dadosIniciais.quantidadeAmostras || 0,
  }));

  useEffect(() => {
    if (open) {
      setFormDataLote({
        codigoLote:
          dadosIniciais.codigoLote ||
          `LOTE-${Math.floor(Math.random() * 900000) + 100000}`,
        descricao: dadosIniciais.descricao || "",
        tipoPecaId: dadosIniciais.tipoPeca?.id?.toString() || "",
        quantidadePecas: dadosIniciais.quantidadePecas || 100,
        quantidadeAmostrasDesejada: dadosIniciais.quantidadeAmostras || 10,
      });
    }
  }, [open, dadosIniciais]);

  const tipoPecaSelecionada = tiposPecas.find(
    (t) => t.id === formDataLote.tipoPecaId
  );

  const handleCriarLote = async () => {
    if (
      !formDataLote.codigoLote.trim() ||
      !formDataLote.descricao.trim() ||
      !formDataLote.tipoPecaId ||
      formDataLote.quantidadePecas <= 0 ||
      formDataLote.quantidadeAmostrasDesejada <= 0 ||
      formDataLote.quantidadeAmostrasDesejada > formDataLote.quantidadePecas
    ) {
      alert(
        "Preencha todos os campos obrigatórios e verifique se as quantidades estão corretas."
      );
      return;
    }

    if (!tipoPecaSelecionada) {
      alert("Tipo de Peça inválido.");
      return;
    }

    const tipoIdNumerico = Number(tipoPecaSelecionada.id);

    const novoLoteDataParaAPI: Omit<
      Lote,
      | "id"
      | "status"
      | "taxaAprovacao"
      | "pecasAprovadas"
      | "pecasReprovadas"
      | "porcentagemAmostragem"
      | "criadoEm"
      | "criadoPor"
      | "dataCriacao"
      | "tipoPecaNome"
    > = {
      codigoLote: formDataLote.codigoLote,
      descricao: formDataLote.descricao,
      tipoPeca: {
        id: tipoIdNumerico,
        nome: tipoPecaSelecionada.nome,
        descricao: tipoPecaSelecionada.descricao,
      },
      tipoPecaId: tipoIdNumerico,
      quantidadePecas: formDataLote.quantidadePecas,
      quantidadeAmostras: formDataLote.quantidadeAmostrasDesejada,
    };

    try {
      await onCriarLote(novoLoteDataParaAPI);
      setOpen(false);
    } catch (e) {
      console.error(e);
      // O erro já é tratado dentro da função onCriarLote (criarLoteAPI)
    }
  };

  const isFormValid =
    formDataLote.codigoLote.trim() !== "" &&
    formDataLote.descricao.trim() !== "" &&
    formDataLote.tipoPecaId !== "" &&
    formDataLote.quantidadePecas > 0 &&
    formDataLote.quantidadeAmostrasDesejada > 0 &&
    formDataLote.quantidadeAmostrasDesejada <= formDataLote.quantidadePecas;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Lote de Produção</DialogTitle>
          <DialogDescription>
            Defina as especificações do lote para iniciar o controle de
            qualidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Código do Lote */}
          <div className="space-y-2">
            <Label htmlFor="codigoLote">
              Código do Lote <span className="text-red-500">*</span>
            </Label>
            <Input
              id="codigoLote"
              value={formDataLote.codigoLote}
              onChange={(e) =>
                setFormDataLote((prev) => ({
                  ...prev,
                  codigoLote: e.target.value,
                }))
              }
              placeholder="Ex: LOTE-MARCO-2024"
            />
          </div>
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricaoLote">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descricaoLote"
              value={formDataLote.descricao}
              onChange={(e) =>
                setFormDataLote((prev) => ({
                  ...prev,
                  descricao: e.target.value,
                }))
              }
              placeholder="Breve descrição do lote"
            />
          </div>
          {/* Tipo de Peça */}
          <div className="space-y-2">
            <Label>
              Tipo de Peça <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formDataLote.tipoPecaId}
              onValueChange={(value) =>
                setFormDataLote((prev) => ({ ...prev, tipoPecaId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Tipo de Peça" />
              </SelectTrigger>
              <SelectContent>
                {tiposPecas.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoPecaSelecionada && (
              <p className="text-xs text-muted-foreground mt-1">
                Campos definidos: {tipoPecaSelecionada.dimensoes.length}
              </p>
            )}
          </div>
          {/* Quantidade de Peças e Amostras */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadePecas">
                Quantidade Total de Peças{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantidadePecas"
                type="number"
                value={formDataLote.quantidadePecas}
                onChange={(e) =>
                  setFormDataLote((prev) => ({
                    ...prev,
                    quantidadePecas: Number(e.target.value),
                  }))
                }
                min={1}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidadeAmostrasDesejada">
                Amostras Desejadas <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantidadeAmostrasDesejada"
                type="number"
                value={formDataLote.quantidadeAmostrasDesejada}
                onChange={(e) =>
                  setFormDataLote((prev) => ({
                    ...prev,
                    quantidadeAmostrasDesejada: Number(e.target.value),
                  }))
                }
                min={1}
                max={formDataLote.quantidadePecas}
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCriarLote} disabled={!isFormValid}>
            <Package className="h-4 w-4 mr-2" />
            Criar Lote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- DIALOGO DE CRIAÇÃO/EDIÇÃO DE TIPO DE PEÇA ---

// --- COMPONENTE PRINCIPAL (GerenciamentoLotesEPecas) ---

export function GerenciamentoLotesEPecas() {
  const { usuario } = useAutenticacao();
  const api = useControleQualidadeApi(); // 💡 Hook da API

  // 🚨 ESTADOS PARA OS DADOS E CARREGAMENTO
  const [tiposPecas, setTiposPecas] = useState<TipoPeca[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [carregandoLotes, setCarregandoLotes] = useState(true);
  const [carregandoTipos, setCarregandoTipos] = useState(true);
  const [erroLotes, setErroLotes] = useState<string | null>(null);
  const [erroTipos, setErroTipos] = useState<string | null>(null);

  const [termoBusca, setTermoBusca] = useState("");

  const [dialogTipoAberto, setDialogTipoAberto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState<TipoPeca | null>(null);

  const [dialogLoteAberto, setDialogLoteAberto] = useState(false);
  const [dadosNovoLote, setDadosNovoLote] = useState<
    Partial<
      Omit<
        Lote,
        | "id"
        | "status"
        | "criadoEm"
        | "criadoPor"
        | "dataCriacao"
        | "tipoPecaId"
        | "tipoPecaNome"
        | "pecasAprovadas"
        | "pecasReprovadas"
        | "taxaAprovacao"
      >
    >
  >({});

  const [abaAtiva, setAbaAtiva] = useState("lotes");

  // Estados do formulário de Tipo de Peça
  const [formData, setFormData] = useState<TipoPecaFormData>({
    nome: "",
    descricao: "",
    // Apenas a propriedade unificada 'dimensoes' é usada agora
    dimensoes: [] as Dimensao[],
  });

  const [novoCampo, setNovoCampo] = useState<Dimensao>({
    nome: "",
    label: "",
    tipo: "number",
    obrigatorio: true,
    unidade: "mm",
  });

  // --- FUNÇÕES DE BUSCA DA API ---

  // 1. Busca Tipos de Peças
  const buscarTiposPecas = useCallback(async () => {
    setCarregandoTipos(true);
    setErroTipos(null);
    try {
      const data: TipoPecaAPI[] = await api.listarTiposPeca(); // Assumindo método

      // Mapeamento: TipoPecaAPI (API) -> TipoPeca (Componente/UI)
      const tiposMapeados: TipoPeca[] = data.map((apiTipo) => ({
        id: apiTipo.id.toString(), // ID como string para uso no Select UI
        nome: apiTipo.nome,
        descricao: apiTipo.descricao,

        // CORREÇÃO ESSENCIAL: O objeto final TipoPeca DEVE ter a propriedade 'dimensoes'
        dimensoes: apiTipo.metadadosCotas.map((cota) => ({
          // Campos básicos
          nome: cota.nome,
          label: cota.label,
          tipo: cota.tipo === "number" ? "number" : "text",
          unidade: cota.unidade || "",

          // Especificações de Medição (Valor Padrão e Tolerância)
          valorPadrao: cota.valorPadrao,
          tolerancia: cota.tolerancia,

          // min, max, step REMOVIDOS: Não são mapeados para a nova Dimensao
        })),

        // As propriedades 'campos' e 'especificacoes' ANTIGAS foram removidas.

        ativo: true, // Simplificação
        criadoEm: "API",
        criadoPor: "API",
        totalMedicoes: 0, // Simulação
      }));
      setTiposPecas(tiposMapeados);
    } catch (error) {
      console.error("Erro ao buscar tipos de peças:", error);
      setErroTipos("Falha ao carregar tipos de peça. Tente recarregar.");
    } finally {
      setCarregandoTipos(false);
    }
  }, [api]);

  // 2. Busca Lotes
  const buscarLotes = useCallback(async () => {
    setCarregandoLotes(true);
    setErroLotes(null);
    try {
      const data: LoteResumidoAPI[] = await api.listarLotesResumido();

      // Mapeamento: LoteResumidoAPI (API) -> Lote (Componente/UI)
      const lotesMapeados: Lote[] = data.map((loteResumido) => {
        // CORREÇÃO: Usamos 'as any' no objeto retornado para acessar
        // as propriedades que estão no backend mas não no LoteResumidoAPI tipado.
        const lote = loteResumido as any;

        return {
          ...loteResumido,
          // Propriedades adicionadas para satisfazer a interface Lote (com fallback):
          tipoPecaId: lote.tipoPecaId || 0,
          pecasAprovadas: lote.pecasAprovadas || 0,
          pecasReprovadas: lote.pecasReprovadas || 0,
          // Cálculo simulado da taxa de aprovação
          taxaAprovacao:
            lote.quantidadePecas > 0
              ? (lote.pecasAprovadas / lote.quantidadePecas) * 100
              : 0,

          descricao: loteResumido.descricao || "N/A",
          tipoPeca: {
            id: lote.tipoPecaId || 0,
            nome: loteResumido.tipoPecaNome,
            descricao: loteResumido.descricao || "N/A",
          },
          criadoEm: loteResumido.dataCriacao?.split("T")[0] || "N/A",
          criadoPor: "API User",
          porcentagemAmostragem:
            (loteResumido.quantidadeAmostras / loteResumido.quantidadePecas) *
            100,
        };
      });

      setLotes(lotesMapeados);
    } catch (error) {
      console.error("Erro ao buscar lotes:", error);
      setErroLotes("Falha ao carregar lotes. Tente recarregar.");
    } finally {
      setCarregandoLotes(false);
    }
  }, [api]);

  // 3. Funçao de Recarregamento Geral
  const recarregarDados = useCallback(() => {
    buscarTiposPecas();
    buscarLotes();
  }, [buscarTiposPecas, buscarLotes]);

  // 4. Execução Inicial
  useEffect(() => {
    recarregarDados();
  }, [recarregarDados]);

  // --- FUNÇÕES DE LOTE (Integração com API) ---
  const criarLoteAPI = async (
    novoLoteData: Omit<
      Lote,
      | "id"
      | "status"
      | "taxaAprovacao"
      | "pecasAprovadas"
      | "pecasReprovadas"
      | "porcentagemAmostragem"
      | "criadoEm"
      | "criadoPor"
      | "dataCriacao"
      | "tipoPecaNome"
    >
  ) => {
    const tipoPecaIdNum = novoLoteData.tipoPecaId;

    if (tipoPecaIdNum <= 0) {
      throw new Error("ID do Tipo de Peça inválido.");
    }

    const requestData: CriarLoteRequestData = {
      codigoLote: novoLoteData.codigoLote,
      descricao: novoLoteData.descricao,
      tipoPecaId: tipoPecaIdNum,
      quantidadePecas: novoLoteData.quantidadePecas,
      quantidadeAmostrasDesejada: novoLoteData.quantidadeAmostras,
      observacoes: novoLoteData.descricao,
    };

    try {
      await api.criarLote(requestData);
      buscarLotes();
    } catch (error) {
      console.error("Falha ao criar lote:", error);
      alert("Erro ao criar o lote. Verifique o console.");
      throw error;
    }
  };

  // Filtros
  const tiposFiltrados = tiposPecas.filter(
    (tipo) =>
      tipo.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      tipo.descricao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const lotesFiltrados = lotes.filter(
    (lote) =>
      lote.codigoLote.toLowerCase().includes(termoBusca.toLowerCase()) ||
      lote.descricao.toLowerCase().includes(termoBusca.toLowerCase()) ||
      lote.tipoPecaNome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // --- FUNÇÕES DE LOTE E TIPO DE PEÇA (Lógica de UI) ---
  const abrirNovoLote = (usarExemplo: boolean = false) => {
    let dados: Partial<
      Omit<
        Lote,
        | "id"
        | "status"
        | "criadoEm"
        | "criadoPor"
        | "dataCriacao"
        | "tipoPecaId"
        | "tipoPecaNome"
        | "pecasAprovadas"
        | "pecasReprovadas"
        | "taxaAprovacao"
      >
    > = {};

    if (usarExemplo && tiposPecas.length > 0) {
      const tipoPadrao = tiposPecas[0];
      const tipoIdNum = Number(tipoPadrao.id);
      dados = {
        codigoLote: `LOTE-${Math.floor(Math.random() * 900000) + 100000}`,
        descricao: `Lote de ${tipoPadrao.nome} (Exemplo)`,
        tipoPeca: {
          id: tipoIdNum,
          nome: tipoPadrao.nome,
          descricao: tipoPadrao.descricao,
        },
        quantidadePecas: 100,
        quantidadeAmostras: 10,
      };
    } else {
      dados = {
        codigoLote: `LOTE-${Math.floor(Math.random() * 900000) + 100000}`,
        descricao: "",
        quantidadePecas: 100,
        quantidadeAmostras: 10,
      };
    }

    setDadosNovoLote(dados);
    setDialogLoteAberto(true);
  };

  // 1. Abrir Novo Tipo
  const abrirNovoTipo = () => {
    setTipoEditando(null);
    setFormData({ nome: "", descricao: "", dimensoes: [] });
    setNovoCampo({
      nome: "",
      label: "",
      tipo: "number",
      obrigatorio: true,
      unidade: "mm",
      // min, max, step REMOVIDOS AQUI
      valorPadrao: undefined, // Opcional: Limpar o valor padrao/tolerancia
      tolerancia: undefined, // Opcional: Limpar o valor padrao/tolerancia
    });
    setDialogTipoAberto(true);
  };

  // 2. Abrir Edição de Tipo
  const abrirEdicaoTipo = (tipo: TipoPeca) => {
    setTipoEditando(tipo);
    // Usa diretamente o array 'dimensoes'
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao,
      dimensoes: [...tipo.dimensoes],
    });

    setDialogTipoAberto(true);
  };

  // 3. Adicionar Dimensão
  const adicionarCampo = () => {
    if (!novoCampo.nome || !novoCampo.label) return;

    // A nova dimensão já é do tipo Dimensao
    const dimensaoFormatada: Dimensao = {
      ...novoCampo,
      // Garante que o nome (chave) não tem espaços
      nome: novoCampo.nome.toLowerCase().replace(/\s+/g, ""),
    };

    // Evita duplicatas pelo nome, verificando em dimensoes
    if (formData.dimensoes.some((d) => d.nome === dimensaoFormatada.nome)) {
      alert(`O campo com o nome '${dimensaoFormatada.nome}' já existe.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      // Adiciona a nova dimensão ao array dimensoes
      dimensoes: [...prev.dimensoes, dimensaoFormatada],
    }));

    // Reseta novoCampo (sem min/max/step)
    setNovoCampo({
      nome: "",
      label: "",
      tipo: "number",
      obrigatorio: true,
      unidade: "mm",
      valorPadrao: undefined, // Limpa especificações do último campo
      tolerancia: undefined, // Limpa especificações do último campo
    });
  };

  // 4. Remover Dimensão
  const removerCampo = (index: number) => {
    setFormData((prev) => {
      // Filtra o array dimensoes
      const novasDimensoes = prev.dimensoes.filter((_, i) => i !== index);

      return {
        ...prev,
        // Apenas retorna o novo array dimensoes
        dimensoes: novasDimensoes,
        // Lógica de 'especificacoes' foi removida
      };
    });
  };

  const { listarTiposPeca } = useControleQualidadeApi();

  const fetchTiposPeca = () => {
    /*
     */
  };
  // 6. Duplicar Tipo (Funciona automaticamente com o novo TipoPeca)
  const duplicarTipo = (tipo: TipoPeca) => {
    // O spread '...tipo' agora inclui 'dimensoes'
    const tipoDuplicado: TipoPeca = {
      ...tipo,
      id: `${tipo.id}-copia-${Date.now()}`,
      nome: `${tipo.nome} (Cópia)`,
      criadoEm: new Date().toISOString().split("T")[0],
      criadoPor: usuario?.nome || "Admin",
      totalMedicoes: 0,
    };
    setTiposPecas((prev) => [...prev, tipoDuplicado]);
  };

  // 7. Alternar Status (Nenhuma mudança necessária)
  const alternarStatus = (id: string) => {
    setTiposPecas((prev) =>
      prev.map((tipo) =>
        tipo.id === id ? { ...tipo, ativo: !tipo.ativo } : tipo
      )
    );
  };
  // ------------------------------------------------------------------------

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gerenciamento de Lotes e Peças
          </h1>
          <p className="text-muted-foreground">
            Configure e gerencie os tipos de peças e lotes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Botão para NOVO LOTE */}
          <Button
            onClick={() => abrirNovoLote(false)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Package className="h-4 w-4" />
            Criar Lote
          </Button>
          <Button
            onClick={abrirNovoTipo}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Ruler className="h-4 w-4" />
            Novo Tipo de Peça
          </Button>
          {/* Botão de Recarregar */}
          <Button
            onClick={recarregarDados}
            variant="outline"
            size="icon"
            disabled={carregandoLotes || carregandoTipos}
          >
            <svg
              className={`h-4 w-4 ${
                carregandoLotes || carregandoTipos ? "animate-spin" : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6" />
              <path d="M2.5 13H8l2-2m-2 2h-4v-4" />
              <path d="M12 2v6h-6" />
              <path d="M2.5 13v6h6" />
              <path d="M21.5 13v6h-6" />
              <path d="M10 2l-2 2" />
            </svg>
          </Button>
        </div>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList>
          <TabsTrigger value="lotes">
            Lista de Lotes ({lotes.length})
          </TabsTrigger>
          <TabsTrigger value="lista-pecas">
            Tipos de Peças ({tiposPecas.length})
          </TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba: Lista de Lotes */}
        <TabsContent value="lotes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lotes de Produção</CardTitle>
              {erroLotes ? (
                <CardDescription className="text-red-500">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  {erroLotes}
                </CardDescription>
              ) : (
                <CardDescription>
                  {carregandoLotes
                    ? "Carregando lotes..."
                    : `${lotesFiltrados.length} lotes encontrados.`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {carregandoLotes ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  Carregando dados da API...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Peça</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Peças</TableHead>
                      <TableHead>Aprov./Reprov.</TableHead>
                      <TableHead>Taxa Aprov.</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotesFiltrados.map((lote) => (
                      <TableRow key={lote.id}>
                        <TableCell className="font-medium">
                          {lote.codigoLote}
                        </TableCell>
                        <TableCell>{lote.tipoPecaNome}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lote.status === "CONCLUIDO"
                                ? "default"
                                : lote.status === "EM_ANDAMENTO"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {lote.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{lote.quantidadePecas}</TableCell>
                        <TableCell>
                          {lote.pecasAprovadas} / {lote.pecasReprovadas}
                        </TableCell>
                        <TableCell className="font-bold">
                          {lote.taxaAprovacao.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              alert(`Detalhes do Lote ${lote.codigoLote}`)
                            }
                          >
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

        {/* Aba: Lista de Tipos de Peça */}
        <TabsContent value="lista-pecas" className="space-y-6">
          {/* Busca */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tipos de peças..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Tipos */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Peças Cadastrados</CardTitle>
              {erroTipos ? (
                <CardDescription className="text-red-500">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  {erroTipos}
                </CardDescription>
              ) : (
                <CardDescription>
                  {carregandoTipos
                    ? "Carregando tipos..."
                    : `${tiposFiltrados.length} tipos encontrados`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {carregandoTipos ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  Carregando dados da API...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Campos</TableHead>
                      <TableHead>Medições</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado Em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiposFiltrados.map((tipo) => (
                      <TableRow key={tipo.id}>
                        <TableCell className="font-medium">
                          {tipo.nome}
                        </TableCell>
                        <TableCell>{tipo.dimensoes.length}</TableCell>
                        <TableCell>{tipo.totalMedicoes}</TableCell>
                        <TableCell>
                          <Badge
                            variant={tipo.ativo ? "default" : "destructive"}
                          >
                            {tipo.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{tipo.criadoEm}</TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicaoTipo(tipo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => duplicarTipo(tipo)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => alternarStatus(tipo.id)}
                          >
                            {tipo.ativo ? (
                              <X className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
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

        {/* Aba: Estatísticas (placeholder) */}
        <TabsContent value="estatisticas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Controle de Qualidade</CardTitle>
              <CardDescription>
                Visão geral das aprovações, reprovações e tendências. (Em breve)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                Gráficos e indicadores de qualidade serão exibidos aqui.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGOS (Flutuantes) */}

      {/* Dialog: Criar Novo Lote */}
      <DialogCriarLote
        open={dialogLoteAberto}
        setOpen={setDialogLoteAberto}
        dadosIniciais={dadosNovoLote}
        tiposPecas={tiposPecas}
        onCriarLote={criarLoteAPI}
      />

      {/* Dialog: Criar/Editar Tipo de Peça */}
      <DialogTipoPeca
        open={dialogTipoAberto}
        setOpen={setDialogTipoAberto}
        formData={formData} // Agora usa TipoPecaFormData
        setFormData={setFormData}
        novoCampo={novoCampo} // Agora usa Dimensao
        setNovoCampo={setNovoCampo}
        adicionarCampo={adicionarCampo}
        removerCampo={removerCampo}
        onSalvoComSucesso={fetchTiposPeca}
      />
    </div>
  );
}
