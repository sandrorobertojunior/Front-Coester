// src/hooks/useFormularioMedicao.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  IFormularioMedicaoViewProps,
  ModoPreenchimento,
  TipoPeca,
  MedicaoPeca,
  EspecificacaoCampo,
  CampoPeca,
} from "./formulario-medicao.types";
import {
  useControleQualidadeApi,
  LoteResumidoAPI,
  LoteDetalheAPI,
  TipoPecaAPI,
  MedicaoAPI,
} from "../contextos/api/controlequalidade";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import { toast } from "@/components/ui/use-toast";

// --- MAPPER DE TIPOS DE PEÇA (Adapta LoteDetalheAPI.tipoPeca para o TipoPeca do formulário) ---
const mapTipoPecaApiToFormulario = (apiData: TipoPecaAPI): TipoPeca => {
  // 1. Mapear Metadados de Cotas para CamposPeca
  const campos: CampoPeca[] = apiData.metadadosCotas.map((cota) => ({
    nome: cota.nome,
    label: cota.label,
    tipo: cota.tipo === "number" || cota.tipo === "text" ? cota.tipo : "text",
    obrigatorio: true,
    min: cota.valorPadrao
      ? cota.valorPadrao - (cota.tolerancia || 0.1)
      : undefined,
    max: cota.valorPadrao
      ? cota.valorPadrao + (cota.tolerancia || 0.1)
      : undefined,
    step: cota.tolerancia ? cota.tolerancia / 10 : 0.01,
  })); // 2. Mapear Metadados de Cotas para Especificacoes (min/max com tolerância)

  const especificacoes: Record<string, EspecificacaoCampo> =
    apiData.metadadosCotas.reduce((acc, cota) => {
      if (cota.tolerancia && cota.valorPadrao) {
        acc[cota.nome] = {
          min: cota.valorPadrao - cota.tolerancia,
          max: cota.valorPadrao + cota.tolerancia,
          tolerancia: cota.tolerancia,
        };
      }
      return acc;
    }, {} as Record<string, EspecificacaoCampo>);

  return {
    id: String(apiData.id),
    nome: apiData.nome,
    campos: campos,
    especificacoes: especificacoes,
  };
};

// --- MAPPER DE MEDICAO API (Adapta MedicaoAPI para MedicaoPeca) ---
const mapMedicaoApiToPeca = (medicao: MedicaoAPI): MedicaoPeca => ({
  numeroPeca: medicao.pecaNumero,
  valores: Object.entries(medicao.dimensoes).reduce((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {} as Record<string, string>),
  observacoes: medicao.observacoes,
  dataHora: new Date(medicao.data),
});

// --- ESTADO INICIAL ---
interface FormularioState {
  loteSelecionadoId: number | null;
  loteDetalhe: LoteDetalheAPI | null;
  pecaAtual: number;
  valores: Record<string, string>;
  observacoes: string;
  erros: Record<string, string>;
  medicoesAcumuladas: MedicaoPeca[];
  salvando: boolean;
  loteCompletado: boolean;
  loteAprovado: boolean | null; // <--- NOVO
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
  medicoesAcumuladas: [],
  salvando: false,
  loteCompletado: false,
  loteAprovado: null, // <--- NOVO
  modo: null,
  cotaIndexAtual: 0,
};

export function useFormularioMedicao(
  onVoltar?: () => void
): IFormularioMedicaoViewProps {
  const api = useControleQualidadeApi();
  const { estaLogado } = useAutenticacao();

  const [estado, setEstado] = useState(ESTADO_INICIAL); // Estado para o dropdown de seleção

  const [lotesDisponiveis, setLotesDisponiveis] = useState<LoteResumidoAPI[]>(
    []
  );
  const [carregandoLotes, setCarregandoLotes] = useState(false);
  const usuarioNome = "sandro"; // --- PROPRIEDADES DERIVADAS ---

  const tipoPeca: TipoPeca | undefined = useMemo(() => {
    if (!estado.loteDetalhe) return undefined;
    return mapTipoPecaApiToFormulario(estado.loteDetalhe.tipoPeca);
  }, [estado.loteDetalhe]);

  const pecasNoLote =
    estado.loteDetalhe?.quantidadeAmostrasDesejada ||
    estado.loteDetalhe?.quantidadePecas ||
    0;

  const cotaAtual: CampoPeca | undefined = useMemo(() => {
    if (!tipoPeca) return undefined;
    return tipoPeca.campos[estado.cotaIndexAtual];
  }, [tipoPeca, estado.cotaIndexAtual]);

  // --- EFEITO 1: CARREGAR LOTES DISPONÍVEIS (Dropdown) ---

  useEffect(() => {
    const carregar = async () => {
      if (!estaLogado) {
        setCarregandoLotes(false);
        return;
      }

      setCarregandoLotes(true);
      setEstado((prev) => ({ ...prev, erros: {} }));

      try {
        // A função listarLotesDoUsuario() foi corrigida para filtrar lotes EM_ANDAMENTO na camada de API
        const response = await api.listarLotesDoUsuario();
        setLotesDisponiveis(response);
      } catch (err) {
        console.error("ERRO CRÍTICO ao carregar lotes da API:", err);
        setEstado((prev) => ({
          ...prev,
          erros: { critico: "Falha ao carregar a lista de Lotes do servidor." },
        }));
      } finally {
        setCarregandoLotes(false);
      }
    };
    carregar();
  }, [api, estaLogado]);

  // --- HANDLER: SELECIONAR LOTE (Busca Detalhes) ---

  const setLoteSelecionadoId = useCallback(
    async (id: number | null) => {
      if (id === null) {
        setEstado(ESTADO_INICIAL);
        return;
      }

      if (!estaLogado) return;

      setCarregandoLotes(true);
      setEstado((prev) => ({
        ...prev,
        loteSelecionadoId: id,
        erros: {},
        loteDetalhe: null,
        medicoesAcumuladas: [],
      }));

      try {
        const detalhe = await api.obterDetalheLote(id);
        const tipo = mapTipoPecaApiToFormulario(detalhe.tipoPeca);
        const valoresIniciais = tipo.campos.reduce((acc, campo) => {
          acc[campo.nome] = "";
          return acc;
        }, {} as Record<string, string>);

        setEstado((prev) => ({
          ...prev,
          loteDetalhe: detalhe,
          valores: valoresIniciais,
          cotaIndexAtual: 0,
          loteCompletado: false,
          loteAprovado: null, // Limpa o estado de aprovação
          modo: null,
          // pecaAtual será definido no useEffect 2 (carregarMedicoesExistentes)
        }));
      } catch (err) {
        console.error("ERRO ao carregar detalhes do lote:", err);
        setEstado((prev) => ({
          ...prev,
          erros: {
            critico: "Falha ao carregar o detalhe do lote selecionado.",
          },
          loteDetalhe: null,
          loteSelecionadoId: null,
        }));
      } finally {
        setCarregandoLotes(false);
      }
    },
    [api, estaLogado]
  );

  // --- EFEITO 2: CARREGAR MEDIÇÕES EXISTENTES E DEFINIR PRÓXIMA PEÇA ---
  useEffect(() => {
    const carregarMedicoesExistentes = async () => {
      if (estado.loteSelecionadoId === null || !estado.loteDetalhe) return;

      setCarregandoLotes(true);
      setEstado((prev) => ({ ...prev, erros: {} }));

      try {
        // 1. CHAMA O NOVO ENDPOINT DE LISTAR MEDIÇÕES
        const medicoesAPI = await api.listarMedicoesLote(
          estado.loteSelecionadoId
        );

        // Mapeia para o formato usado no Front-end (MedicaoPeca)
        const medicoesFormatadas = medicoesAPI.map(mapMedicaoApiToPeca);

        // 2. CALCULA O PRÓXIMO NÚMERO DA PEÇA
        const pecaNumeros = medicoesAPI.map((m) => m.pecaNumero);
        // Encontra o maior pecaNumero existente ou 0 (se a lista for vazia)
        const maiorPecaNumero =
          pecaNumeros.length > 0 ? Math.max(...pecaNumeros) : 0;

        // A próxima peça a medir é a maior + 1. Se for 0, a próxima é 1.
        const nextPecaNumero = maiorPecaNumero + 1;

        // 3. Verifica se o lote está completo
        const limiteAmostras =
          estado.loteDetalhe.quantidadeAmostrasDesejada ||
          estado.loteDetalhe.quantidadePecas;
        const loteCompletado = nextPecaNumero > limiteAmostras;

        // 4. ATUALIZA O ESTADO
        setEstado((prev) => ({
          ...prev,
          medicoesAcumuladas: medicoesFormatadas,
          pecaAtual: loteCompletado ? limiteAmostras : nextPecaNumero, // Trava no limite se completado
          loteCompletado: loteCompletado,
          // Mantém valores e observacoes limpos
          // Mantém modo: null, aguardando a seleção do modo
        }));
      } catch (err) {
        console.error("ERRO CRÍTICO ao carregar medições existentes:", err);
        setEstado((prev) => ({
          ...prev,
          erros: { critico: "Falha ao carregar medições anteriores." },
        }));
      } finally {
        setCarregandoLotes(false);
      }
    };

    if (estado.loteSelecionadoId !== null && estado.loteDetalhe !== null) {
      carregarMedicoesExistentes();
    }
  }, [api, estado.loteSelecionadoId, estado.loteDetalhe]);

  // --- HANDLER: SALVAR MEDIÇÃO (Envia para a API) ---

  const salvarMedicao = useCallback(async () => {
    if (
      !tipoPeca ||
      estado.loteSelecionadoId === null ||
      !estaLogado ||
      estado.salvando
    )
      return; // Lógica de validação (APENAS OBRIGATORIEDADE)

    const errosDeValidacao = ((valores) => {
      const novosErros: Record<string, string> = {};
      const camposParaValidar =
        estado.modo === "cota-a-cota" && cotaAtual
          ? [cotaAtual]
          : tipoPeca.campos;

      camposParaValidar.forEach((campo) => {
        const valor = valores[campo.nome];
        if (campo.obrigatorio && !valor) {
          novosErros[campo.nome] = "Este campo é obrigatório.";
        }
        // 🚨 REMOVIDA A VALIDAÇÃO DE TOLERÂNCIA (min/max) para permitir a entrada de dados fora de especificação.
      });
      return novosErros;
    })(estado.valores);

    if (Object.keys(errosDeValidacao).length > 0) {
      setEstado((prev) => ({
        ...prev,
        erros: { ...prev.erros, ...errosDeValidacao },
      }));
      return;
    }

    setEstado((prev) => ({ ...prev, salvando: true, erros: {} }));

    try {
      // Monta o payload conforme a interface CriarMedicaoData (sem pecaNumero)
      const payloadParaAPI = {
        dimensoes: Object.entries(estado.valores).reduce(
          (acc, [key, value]) => {
            acc[key] = Number(value); // Garante que o valor é number (como esperado pelo backend)
            return acc;
          },
          {} as Record<string, number>
        ),
        observacoes: estado.observacoes,
      };

      // REQUISIÇÃO: Envia a medição para o lote selecionado (POST /api/lotes/{loteId}/medicoes)
      const loteAtualizadoMedicao = await api.adicionarMedicao(
        estado.loteSelecionadoId,
        payloadParaAPI
      );

      let loteAtualizado: LoteDetalheAPI = loteAtualizadoMedicao; // Inicia com o retorno da adição

      // --- Lógica de AVANÇO (Avança o contador de peças no FE) ---

      let proximaPeca = estado.pecaAtual;
      let proximaCotaIndex = estado.cotaIndexAtual;
      let loteCompletado = false;
      let valoresResetados = tipoPeca.campos.reduce(
        (acc, campo) => ({ ...acc, [campo.nome]: "" }),
        {} as Record<string, string>
      );
      let novosValores = valoresResetados;

      if (estado.modo === "peca-a-peca") {
        // Modo Peca-a-Peca: Sempre avança para a próxima peça
        proximaPeca = estado.pecaAtual + 1;
        loteCompletado = proximaPeca > pecasNoLote;
        proximaPeca = loteCompletado ? estado.pecaAtual : proximaPeca;
        novosValores = valoresResetados; // Reseta todos os campos
      } else if (estado.modo === "cota-a-cota") {
        const totalCotas = tipoPeca.campos.length;

        if (estado.pecaAtual < pecasNoLote) {
          // 1. Ainda há peças para medir DENTRO desta cota
          proximaPeca = estado.pecaAtual + 1;
          proximaCotaIndex = estado.cotaIndexAtual; // Permanece na cota atual
          // Limpa APENAS o campo da cota atual (para a próxima peça)
          novosValores = { ...estado.valores, [cotaAtual!.nome]: "" };
        } else {
          // 2. Todas as peças desta cota foram medidas. Avança para a próxima cota.
          const indexProximaCota = estado.cotaIndexAtual + 1;

          if (indexProximaCota < totalCotas) {
            // Avança a cota e reinicia o contador de peças para 1
            proximaCotaIndex = indexProximaCota;
            proximaPeca = 1; // Reinicia a contagem de peças (dentro da nova cota)
            // Limpa o campo da COTA ATUAL (que agora foi concluída)
            novosValores = { ...estado.valores, [cotaAtual!.nome]: "" };
          } else {
            // 3. Todas as cotas de todas as peças foram medidas. Lote Completo.
            loteCompletado = true;
            proximaCotaIndex = estado.cotaIndexAtual; // Mantém o último index
            proximaPeca = estado.pecaAtual; // Mantém a última peça

            novosValores = valoresResetados; // Limpa tudo
          }
        }
      }

      let loteAprovadoResultado: boolean | null = null; // Variável para armazenar o resultado final

      if (loteCompletado) {
        setEstado((prev) => ({ ...prev, salvando: true })); // Re-ativa o salvando para a chamada de conclusão

        try {
          // 1. CHAMADA À API PARA CONCLUIR O LOTE (Retorna boolean de sucesso ou lança erro)
          const sucessoConclusao = await api.concluirLote(
            estado.loteSelecionadoId
          );

          if (sucessoConclusao) {
            // 2. RECARREGA OS DETALHES DO LOTE PARA OBTER O STATUS FINAL (APROVADO/REPROVADO)
            loteAtualizado = await api.obterDetalheLote(
              estado.loteSelecionadoId
            );

            // 3. DETERMINA O STATUS FINAL DE APROVAÇÃO
            const isAprovado = loteAtualizado.status === "APROVADO";
            loteAprovadoResultado = isAprovado;

            // 4. ATUALIZA O ESTADO DO COMPONENTE PARA TELA DE CONCLUSÃO
            setEstado((prev) => ({
              ...prev,
              salvando: false, // Conclusão e recarga bem-sucedidas
              loteCompletado: true,
              loteAprovado: isAprovado, // Usa o status obtido da API
              loteDetalhe: loteAtualizado, // Atualiza detalhes para a tela final
            }));

            // 5. EXIBE O TOAST DE SUCESSO
            toast({
              title: `Lote ${isAprovado ? "APROVADO" : "REPROVADO"}!`,
              description: `O lote ${
                loteAtualizado.codigoLote
              } foi concluído e seu status final é ${
                isAprovado ? "Aprovado" : "Reprovado"
              }.`,
              variant: isAprovado ? "default" : "destructive",
            });

            // Retorna para evitar a execução da próxima seção de código
            return;
          } else {
            // Trata o caso improvável onde a API retorna false (falha lógica, não de conexão/servidor)
            throw new Error(
              "Conclusão do lote falhou por motivo interno não detalhado."
            );
          }
        } catch (error: any) {
          console.error("Falha ao concluir ou recarregar lote:", error);

          // Ação em caso de erro (mantendo o lote em estado de erro/reprovado no front)
          setEstado((prev) => ({
            ...prev,
            erros: {
              ...prev.erros,
              critico:
                error?.message ||
                "Erro ao concluir lote no servidor. Exibindo Reprovado.",
            },
            loteCompletado: true,
            salvando: false,
            loteAprovado: false, // Força REPROVADO no front-end em caso de erro
          }));

          // Notificação de erro
          toast({
            title: "Erro de Conclusão",
            description:
              error?.response?.data?.message ||
              "Não foi possível finalizar o lote devido a um erro de rede ou validação.",
            variant: "destructive",
          });

          return; // Sai da função após o erro
        }
      }
      // 🚨 FIM DO BLOCO DE CONCLUSÃO 🚨

      // Mapeia as medições atualizadas que vieram do backend
      const medicoesAtualizadas =
        loteAtualizado.medicoes.map(mapMedicaoApiToPeca);

      // Atualiza o estado (apenas se o lote NÃO foi completado)
      setEstado((prev) => ({
        ...prev,
        medicoesAcumuladas: medicoesAtualizadas, // Usa a lista atualizada do backend
        pecaAtual: proximaPeca,
        cotaIndexAtual: proximaCotaIndex,
        loteCompletado: loteCompletado,
        loteAprovado: null, // Certifica que o resultado da aprovação é nulo
        valores: novosValores, // Aplica a limpeza
        observacoes: "",
        salvando: false,
        loteDetalhe: loteAtualizado, // Atualiza os contadores do lote (pecasAprovadas, etc.)
      }));
    } catch (error) {
      console.error("Falha ao salvar medição na API:", error);
      setEstado((prev) => ({
        ...prev,
        salvando: false,
        erros: {
          ...prev.erros,
          critico: "Erro ao enviar medição para o servidor. Tente novamente.",
        },
      }));
    }
  }, [
    estado.valores,
    estado.observacoes,
    estado.pecaAtual,
    estado.cotaIndexAtual,
    estado.loteSelecionadoId,
    estado.modo,
    tipoPeca,
    pecasNoLote,
    api,
    estaLogado,
    cotaAtual,
  ]);

  // --- HANDLER: RECOMEÇAR MEDIÇÃO (PATCH /api/lotes/{id}/recomecar) ---

  const recomecarMedicao = useCallback(async () => {
    if (estado.loteSelecionadoId === null || estado.salvando) return;

    if (
      !window.confirm(
        "Você tem certeza que deseja recomeçar a medição? Todas as medições atuais para este lote serão APAGADAS e a contagem será zerada."
      )
    ) {
      return;
    }

    setEstado((prev) => ({ ...prev, salvando: true, erros: {} }));

    try {
      // 1. CHAMADA À API (PATCH /api/lotes/{id}/recomecar)
      const loteAtualizado = await api.recomecarLote(estado.loteSelecionadoId);

      // 2. RESET DO ESTADO LOCAL
      const tipo = mapTipoPecaApiToFormulario(loteAtualizado.tipoPeca);
      const valoresIniciais = tipo.campos.reduce((acc, campo) => {
        acc[campo.nome] = "";
        return acc;
      }, {} as Record<string, string>);

      setEstado((prev) => ({
        ...prev,
        loteDetalhe: loteAtualizado,
        medicoesAcumuladas: [], // Zera a lista
        pecaAtual: 1, // Volta para a primeira peça
        valores: valoresIniciais, // Limpa os campos
        observacoes: "",
        cotaIndexAtual: 0,
        loteCompletado: false,
        loteAprovado: null, // Limpa o estado de aprovação
        modo: null, // Volta à seleção de modo
        salvando: false, // Finaliza salvamento
      }));
    } catch (error) {
      console.error("Falha ao recomeçar a medição:", error);
      setEstado((prev) => ({
        ...prev,
        erros: {
          ...prev.erros,
          critico: "Erro ao recomeçar o lote no servidor. Tente novamente.",
        },
        salvando: false,
      }));
    }
  }, [estado.loteSelecionadoId, estado.salvando, api]);

  // --- HANDLER: CANCELAR MEDIÇÃO (Muda status do Lote para "Em Andamento") ---
  // Este handler mantém o lote em andamento (sem apagar as medições) e volta para o dashboard
  const cancelarMedicao = useCallback(async () => {
    if (estado.loteSelecionadoId === null || estado.salvando) {
      // Apenas reseta o formulário localmente se nenhum lote estiver selecionado
      setEstado(ESTADO_INICIAL);
      if (onVoltar) onVoltar();
      return;
    }

    setEstado((prev) => ({ ...prev, salvando: true, erros: {} }));

    try {
      // 1. CHAMA A API para mudar o status para "EM_ANDAMENTO" (ou similar)
      // Se não houver endpoint para mudar o status, pode remover esta linha ou mockar
      /* await api.mudarStatusLote(estado.loteSelecionadoId, "EM_ANDAMENTO"); */

      // 2. RESET DO ESTADO LOCAL
      setEstado(ESTADO_INICIAL); // Reseta o estado
      if (onVoltar) onVoltar(); // Volta para o dashboard
    } catch (error) {
      console.error("Falha ao cancelar medição/mudar status do lote:", error);
      setEstado((prev) => ({
        ...prev,
        erros: {
          ...prev.erros,
          critico:
            "Erro ao atualizar status do lote. Por favor, tente novamente.",
        },
        salvando: false,
      }));
    }
  }, [estado.loteSelecionadoId, estado.salvando, api, onVoltar]);

  // --- OUTROS HANDLERS (mantidos) ---

  const setModo = useCallback(
    (modo: ModoPreenchimento) => {
      setEstado((prev) => ({
        ...prev,
        modo,
        pecaAtual: 1,
        cotaIndexAtual: 0,
        valores:
          tipoPeca?.campos.reduce(
            (acc, campo) => ({ ...acc, [campo.nome]: "" }),
            {} as Record<string, string>
          ) || {},
        observacoes: "", // Garante que a observação também é limpa
        erros: {}, // Limpa erros ao mudar de modo
      }));
    },
    [tipoPeca]
  ); // Adicionado tipoPeca como dependência para resetar valores

  const atualizarValor = useCallback((campo: string, valor: string) => {
    setEstado((prev) => ({
      ...prev,
      valores: { ...prev.valores, [campo]: valor },
      erros: { ...prev.erros, [campo]: "" }, // Limpa erros específicos do campo ao atualizar
    }));
  }, []);
  const setObservacoes = useCallback((obs: string) => {
    setEstado((prev) => ({ ...prev, observacoes: obs }));
  }, []);
  const existeErroCritico = useCallback(() => {
    return !!estado.erros.critico;
  }, [estado.erros.critico]);
  const resetarFormulario = useCallback(() => {
    setEstado(ESTADO_INICIAL);
  }, []);
  const verificarEspecificacao = useCallback(
    (nomeCampo: string, valor: string): "aprovado" | "fora-spec" | "info" => {
      if (!tipoPeca || !valor) return "info";
      const spec = tipoPeca.especificacoes[nomeCampo];
      const numValor = Number(valor);
      if (isNaN(numValor) || !spec) return "info";
      return numValor >= spec.min && numValor <= spec.max
        ? "aprovado"
        : "fora-spec";
    },
    [tipoPeca]
  ); // --- RETORNO DO HOOK ---

  return {
    // Estado de Configuração de Lotes
    lotesDisponiveis,
    carregandoLotes,
    loteSelecionadoId: estado.loteSelecionadoId,
    pecasNoLote,
    tipoPeca,
    modo: estado.modo, // Estado de Preenchimento

    pecaAtual: estado.pecaAtual,
    cotaAtual,
    valores: estado.valores,
    observacoes: estado.observacoes,
    erros: estado.erros,
    medicoesAcumuladas: estado.medicoesAcumuladas, // Estado de Ação

    salvando: estado.salvando,
    loteCompletado: estado.loteCompletado,
    loteAprovado: estado.loteAprovado, // <--- Resultado da conclusão
    usuarioNome, // Handlers

    setLoteSelecionadoId,
    setModo,
    atualizarValor,
    setObservacoes,
    salvarMedicao,
    resetarFormulario,
    recomecarMedicao, // Handler para recomeçar o lote (apaga tudo)
    cancelarMedicao, // <--- Handler para cancelar (mantém medições e muda status) // Funções de Lógica

    existeErroCritico,
    verificarEspecificacao, // Propriedade do container

    onVoltar,
  };
}
