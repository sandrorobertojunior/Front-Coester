// src/hooks/useFormularioMedicao.ts

import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import { toast } from "@/components/ui/use-toast";

// [MUDANÇA] Importando apenas os tipos da API e as props da View
import {
  useControleQualidadeApi,
  LoteResumidoResponse,
  LoteResponse,
  TipoPecaResponse,
  MedicaoResponse,
  AdicionarMedicaoRequest,
  CotaMetadata,
} from "../contextos/api/controlequalidade";

export type ModoPreenchimento = "peca-a-peca" | "cota-a-cota";

export interface IFormularioMedicaoViewProps {
  // --- Estado de Configuração do Lote ---
  lotesDisponiveis: LoteResumidoResponse[]; // [CORREÇÃO] Deve ser um array
  carregandoLotes: boolean;
  loteSelecionadoId: number | null;
  setClicouSelect: (clicou: boolean) => void;

  // --- Detalhes da Peça e Especificação (Derivados do lote) ---
  tipoPeca?: TipoPecaResponse; // [CORREÇÃO] Usando o tipo de resposta da API
  pecasNoLote: number;
  modo: ModoPreenchimento | null;

  // --- Estado de Preenchimento da Medição ---
  pecaAtual: number;
  cotaAtual?: CotaMetadata; // [CORREÇÃO] Usando o tipo de metadados da API
  valores: Record<string, string>;
  observacoes: string;
  erros: Record<string, string>;
  medicoesAcumuladas: MedicaoResponse[]; // [CORREÇÃO] Usando o tipo de resposta da API

  // --- Estado de Ação e Usuário ---
  salvando: boolean;
  loteCompletado: boolean;
  loteAprovado: boolean | null;
  usuarioNome: string;

  // --- Handlers (Funções de Callback) ---
  setLoteSelecionadoId: (id: number | null) => Promise<void>;
  setModo: (modo: ModoPreenchimento) => void;
  atualizarValor: (campo: string, valor: string) => void;
  setObservacoes: (obs: string) => void;
  salvarMedicao: () => Promise<void>;
  resetarFormulario: () => void;
  recomecarMedicao: () => Promise<void>;
  cancelarMedicao: () => void; // [CORREÇÃO] Geralmente síncrono
  focarPrimeiraCota: () => void;
  // --- Funções de Lógica ---
  existeErroCritico: () => boolean;
  verificarEspecificacao: (
    nomeCampo: string,
    valor: string
  ) => "aprovado" | "fora-spec" | "info";

  // --- Propriedades do Container ---
  onVoltar?: () => void;
  obterLote: (loteId: number) => Promise<LoteResponse | undefined>;
}
// --- ESTADO INICIAL ---
interface FormularioState {
  loteSelecionadoId: number | null;
  loteDetalhe: LoteResponse | null;
  pecaAtual: number;
  valores: Record<string, string>;
  observacoes: string;
  erros: Record<string, string>;
  salvando: boolean;
  loteCompletado: boolean;
  loteAprovado: boolean | null;
  modo: ModoPreenchimento | null;
  cotaIndexAtual: number;
}

const ESTADO_INICIAL: FormularioState = {
  loteSelecionadoId: null,
  loteDetalhe: null,
  pecaAtual: 1,
  valores: {},
  observacoes: "",
  erros: {},
  salvando: false,
  loteCompletado: false,
  loteAprovado: null,
  modo: null,
  cotaIndexAtual: 0,
};

export function useFormularioMedicao(
  onVoltar?: () => void
): IFormularioMedicaoViewProps {
  const api = useControleQualidadeApi();
  const { usuario } = useAutenticacao();

  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [lotesDisponiveis, setLotesDisponiveis] = useState<
    LoteResumidoResponse[]
  >([]);
  const [clicouSelect, setClicouSelect] = useState<boolean>(false);
  const [carregandoLotes, setCarregandoLotes] = useState(false);

  const [medicoesCotaACota, setMedicoesCotaACota] = useState<
    Record<string, Record<number, string>>
  >({});
  const usuarioNome = usuario?.nome || "Usuário";

  // --- PROPRIEDADES DERIVADAS DIRETAMENTE DOS TIPOS DA API ---

  const tipoPeca: TipoPecaResponse | undefined = estado.loteDetalhe?.tipoPeca;
  const pecasNoLote = estado.loteDetalhe?.quantidadeAmostrasDesejada || 0;
  const medicoesAcumuladas: MedicaoResponse[] =
    estado.loteDetalhe?.medicoes || [];

  const cotaAtual: CotaMetadata | undefined = useMemo(() => {
    if (!tipoPeca || estado.modo !== "cota-a-cota") return undefined;
    return tipoPeca.metadadosCotas[estado.cotaIndexAtual];
  }, [tipoPeca, estado.cotaIndexAtual, estado.modo]);

  // --- EFEITOS E HANDLERS ---

  useEffect(() => {
    const carregarLotes = async () => {
      if (!usuario || !clicouSelect) return;

      setCarregandoLotes(true);
      try {
        const response = await api.listarLotesDoUsuario();
        setLotesDisponiveis(response);
      } catch (err) {
        toast({
          title: "Erro",
          description: "Falha ao carregar a lista de lotes.",
          variant: "destructive",
        });
      } finally {
        setCarregandoLotes(false);
        setClicouSelect(false);
      }
    };
    carregarLotes();
  }, [api, usuario, clicouSelect]);

  const setLoteSelecionadoId = useCallback(
    async (id: number | null) => {
      if (id === null) {
        setEstado(ESTADO_INICIAL);
        return;
      }
      setCarregandoLotes(true);
      try {
        const detalheLote = await api.obterDetalheLote(id);
        const maiorPecaNumero =
          detalheLote.medicoes.length > 0
            ? Math.max(...detalheLote.medicoes.map((m) => m.pecaNumero))
            : 0;
        const proximaPeca = maiorPecaNumero + 1;

        setEstado({
          ...ESTADO_INICIAL,
          loteSelecionadoId: id,
          loteDetalhe: detalheLote,
          pecaAtual:
            proximaPeca > detalheLote.quantidadeAmostrasDesejada
              ? detalheLote.quantidadeAmostrasDesejada
              : proximaPeca,
          loteCompletado: proximaPeca > detalheLote.quantidadeAmostrasDesejada,
        });
      } catch (err) {
        toast({
          title: "Erro",
          description: "Falha ao carregar os detalhes do lote.",
          variant: "destructive",
        });
      } finally {
        setCarregandoLotes(false);
      }
    },
    [api]
  );

  const salvarMedicao = useCallback(async () => {
    if (!tipoPeca || !estado.loteSelecionadoId || estado.salvando) return;

    setEstado((prev) => ({ ...prev, salvando: true }));
    try {
      const payload: AdicionarMedicaoRequest = {
        dimensoes: Object.entries(estado.valores).reduce(
          (acc, [key, value]) => {
            if (value.trim() !== "") acc[key] = Number(value);
            return acc;
          },
          {} as Record<string, number>
        ),
        observacoes: estado.observacoes,
      };

      const loteAtualizado = await api.adicionarMedicao(
        estado.loteSelecionadoId,
        payload
      );

      const proximaPeca = estado.pecaAtual + 1;
      const loteCompletado =
        proximaPeca > loteAtualizado.quantidadeAmostrasDesejada;

      if (loteCompletado) {
        const aprovado = await api.concluirLote(estado.loteSelecionadoId);
        const loteFinal = await api.obterDetalheLote(estado.loteSelecionadoId);
        setEstado((prev) => ({
          ...prev,
          loteDetalhe: loteFinal,
          loteAprovado: aprovado,
          loteCompletado: true,
          salvando: false,
        }));
        toast({ title: `Lote ${aprovado ? "APROVADO" : "REPROVADO"}!` });
        return;
      }

      setEstado((prev) => ({
        ...prev,
        loteDetalhe: loteAtualizado,
        pecaAtual: proximaPeca,
        valores: {},
        observacoes: "",
        salvando: false,
      }));
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a medição.",
        variant: "destructive",
      });
      setEstado((prev) => ({ ...prev, salvando: false }));
    }
  }, [api, estado, tipoPeca]);
  const setCotaIndex = useCallback((index: number) => {
    setEstado((prev) => ({
      ...prev,
      cotaIndexAtual: index,
    }));
  }, []);

  const obterLote = useCallback(
    async (loteId: number): Promise<LoteResponse | undefined> => {
      // 1. Não depende mais de 'estado.loteSelecionadoId', mas sim do parâmetro
      if (!loteId) return;

      try {
        // 2. Chama a API usando o ID recebido
        const lote = await api.obterDetalheLote(loteId);

        // 3. ❌ REMOÇÃO: Não atualizamos mais o estado aqui.
        //    Se precisar atualizar o estado com o lote, faça isso no local onde você chamar esta função.

        // ✅ RETORNA o objeto lote
        return lote;
      } catch (error) {
        toast({
          title: "Erro ao obter lote",
          description: "Não foi possível obter os detalhes do lote.",
          variant: "destructive",
        });
        // Em caso de erro, retornamos 'undefined' (ou lançamos o erro, dependendo da sua necessidade)
        return undefined;
      }
    },
    [] // 4. Dependências vazias, pois a função agora depende apenas do seu parâmetro (loteId)
  );

  // --- HANDLER: VOLTAR PARA A PRIMEIRA COTA (O que você pediu!) ---
  const focarPrimeiraCota = useCallback(() => {
    console.log("Focando na primeira cota...");
    setEstado((prev) => ({
      ...prev,
      cotaIndexAtual: 0, // O primeiro input é sempre o índice 0
    }));
  }, []);
  const recomecarMedicao = useCallback(async () => {
    if (!estado.loteSelecionadoId) return;
    if (
      !window.confirm(
        "Tem certeza que deseja apagar todas as medições deste lote?"
      )
    )
      return;
    try {
      const loteAtualizado = await api.recomecarLote(estado.loteSelecionadoId);
      setEstado({
        ...ESTADO_INICIAL,
        loteSelecionadoId: estado.loteSelecionadoId,
        loteDetalhe: loteAtualizado,
      });
      toast({
        title: "Medição Recomeçada",
        description: "Todas as medições foram apagadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível recomeçar a medição.",
        variant: "destructive",
      });
    }
  }, [api, estado.loteSelecionadoId]);

  const verificarEspecificacao = useCallback(
    (nomeCampo: string, valor: string): "aprovado" | "fora-spec" | "info" => {
      if (!tipoPeca || !valor) return "info";

      const cota = tipoPeca.metadadosCotas.find((c) => c.nome === nomeCampo);
      const numValor = Number(valor);

      if (
        isNaN(numValor) ||
        !cota ||
        cota.valorPadrao === undefined ||
        cota.tolerancia === undefined
      ) {
        return "info";
      }

      const min = cota.valorPadrao - cota.tolerancia;
      const max = cota.valorPadrao + cota.tolerancia;

      return numValor >= min && numValor <= max ? "aprovado" : "fora-spec";
    },
    [tipoPeca]
  );

  const setModo = useCallback(
    (modo: ModoPreenchimento) =>
      setEstado((prev) => ({ ...prev, modo, pecaAtual: 1, cotaIndexAtual: 0 })),
    []
  );
  const atualizarValor = useCallback(
    (campo: string, valor: string) =>
      setEstado((prev) => ({
        ...prev,
        valores: { ...prev.valores, [campo]: valor },
      })),
    []
  );
  const setObservacoes = useCallback(
    (obs: string) => setEstado((prev) => ({ ...prev, observacoes: obs })),
    []
  );
  const resetarFormulario = useCallback(() => setEstado(ESTADO_INICIAL), []);
  const cancelarMedicao = useCallback(() => {
    setEstado(ESTADO_INICIAL);
    if (onVoltar) onVoltar();
  }, [onVoltar]);
  const existeErroCritico = useCallback(
    () => !!estado.erros.critico,
    [estado.erros]
  );

  return {
    lotesDisponiveis,
    carregandoLotes,
    loteSelecionadoId: estado.loteSelecionadoId,
    pecasNoLote,
    tipoPeca,
    modo: estado.modo,
    pecaAtual: estado.pecaAtual,
    cotaAtual,
    valores: estado.valores,
    observacoes: estado.observacoes,
    erros: estado.erros,
    medicoesAcumuladas,
    salvando: estado.salvando,
    loteCompletado: estado.loteCompletado,
    loteAprovado: estado.loteAprovado,
    usuarioNome,
    setLoteSelecionadoId,
    setModo,
    atualizarValor,
    setObservacoes,
    salvarMedicao,
    resetarFormulario,
    recomecarMedicao,
    cancelarMedicao,
    existeErroCritico,
    verificarEspecificacao,
    onVoltar,
    setClicouSelect,
    focarPrimeiraCota,
    obterLote,
  };
}
