// src/hooks/useControleQualidadeApi.ts

import { useMemo } from "react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import api from "@/contextos/api/api"; // 💡 Cliente Axios configurado
import { AxiosResponse } from "axios";
import { MedicaoPeca, TipoPeca } from "@/hooks/formulario-medicao.types";

// ------------------------------------------------------------------
// --- 1. INTERFACES DE DADOS DA API (DTOs do Backend) ---

type TipoCampo = "number" | "text";
const ADMIN_ENDPOINT = "/api/admin";
export interface CriarLoteRequestData {
  codigoLote?: string;
  descricao: string;
  tipoPecaId: number;
  quantidadePecas: number;
  quantidadeAmostrasDesejada?: number;
  observacoes?: string;
}
export interface UsuarioDto {
  id: number;
  username: string;
  email: string;
  // Adicione outros campos necessários aqui
}

/**
 * Estrutura de metadados de cota retornada pela API
 */
export interface CotaMetadataAPI {
  nome: string;
  label: string;
  tipo: "number" | "text" | "checkbox";
  unidade: string;
  valorPadrao?: number;
  tolerancia?: number;
  // removidos: obrigatorio, min, max, step
}

export interface TipoPecaAPI {
  id: number;
  nome: string;
  descricao: string;
  metadadosCotas: CotaMetadataAPI[];
}

export interface TipoPecaAPIRequest {
  id: number;
  nome: string;
  descricao: string;
  metadadosCotas: string; // A string JSON
}
export interface CriarTipoPecaRequestData
  extends Omit<TipoPecaAPIRequest, "id"> {}

export interface MedicaoAPI {
  id: number;
  data: string;
  pecaNumero: number;
  dimensoes: Record<string, number>;
  status: "APROVADO" | "REPROVADO";
  observacoes: string;
}

export interface LoteDetalheAPI {
  id: number;
  codigoLote: string;
  descricao: string;
  tipoPeca: TipoPecaAPI;
  quantidadePecas: number;
  quantidadeAmostrasDesejada: number;
  quantidadeAmostras: number;
  porcentagemAmostragem: number;
  pecasAprovadas: number;
  pecasReprovadas: number;
  taxaAprovacao: number;
  status: "EM_ANDAMENTO" | "EM_ANALISE" | "APROVADO" | "REPROVADO";
  dataCriacao: string;
  medicoes: MedicaoAPI[];
}

export interface LoteResumidoAPI {
  id: number;
  codigoLote: string;
  descricao: string;
  tipoPecaNome: string;
  quantidadePecas: number;
  quantidadeAmostras: number;
  taxaAprovacao: number;
  status:
    | "EM_ANDAMENTO"
    | "EM_ANALISE"
    | "CONCLUIDO"
    | "APROVADO"
    | "REPROVADO";
  dataCriacao: string;
}

export interface DashboardAPI {
  totalLotes: number;
  lotesEmAndamento: number;
  lotesConcluidos: number;
  taxaAprovacaoGeral: number;
  tempoMedioMedicaoMinutos: number;
  lotesRecentes: LoteResumidoAPI[];
}

export interface CriarMedicaoData {
  dimensoes: Record<string, number>;
  observacoes: string;
}

// ------------------------------------------------------------------
// --- INTERFACES DO FORMULÁRIO (FRONTEND) ---
// ------------------------------------------------------------------

/**
 * Estrutura de Dimensão usada localmente no formulário (frontend)
 */
export interface Dimensao {
  nome: string;
  label: string;
  tipo: TipoCampo;
  unidade?: string;
  valorPadrao?: number;
  tolerancia?: number;
  // removido: obrigatorio
}

/**
 * Estrutura de Dimensão enviada no array que é serializado para a API
 */
export interface DimensaoRequest {
  nome: string;
  label: string;
  tipo: TipoCampo; // Tipagem mais estrita no TS
  unidade?: string;
  valorPadrao?: number;
  tolerancia?: number;
}
/**
 * Payload para Criação ou Atualização de um Tipo de Peça (envio para API)
 */
export interface TipoPecaFormPayload {
  nome: string;
  descricao: string;
  dimensoes: DimensaoRequest[]; // ✅ CORREÇÃO CRÍTICA: Agora é um array de objetos.
}

// ------------------------------------------------------------------
// --- CONTRATO DO HOOK (IControleQualidadeApi - Mantido) ---
// ------------------------------------------------------------------

interface IControleQualidadeApi {
  // Tipos de Peça
  listarTiposPeca: () => Promise<TipoPecaAPI[]>;
  obterTipoPeca: (id: number | string) => Promise<TipoPecaAPI>;
  cadastrarTipoPeca: (data: TipoPecaFormPayload) => Promise<TipoPecaAPI>;
  atualizarTipoPeca: (
    id: number | string,
    data: TipoPecaFormPayload
  ) => Promise<TipoPecaAPI>;
  excluirTipoPeca: (id: number | string) => Promise<void>;
  buscarTiposPeca: (nome: string) => Promise<TipoPecaAPI[]>;
  obterTiposComLotes: () => Promise<TipoPecaAPI[]>;
  obterEstatisticasUsoTipoPeca: () => Promise<Object[]>;
  getTemplateMedicao: (id: number | string) => Promise<any>;

  // Lotes (Leitura e Dashboard)

  listarLotesResumido: () => Promise<LoteResumidoAPI[]>;
  listarLotesDoUsuario: () => Promise<LoteResumidoAPI[]>;
  obterDetalheLote: (id: number | string) => Promise<LoteDetalheAPI>;
  criarLote: (data: CriarLoteRequestData) => Promise<LoteDetalheAPI>;
  atualizarLote: (id: number | string, data: any) => Promise<LoteDetalheAPI>;
  excluirLote: (id: number | string) => Promise<void>;
  obterDashboard: () => Promise<DashboardAPI>;

  // Lotes (Filtros)

  listarLotesPorStatus: (status: string) => Promise<LoteResumidoAPI[]>;
  buscarLotes: (descricao: string) => Promise<LoteResumidoAPI[]>;
  obterEstatisticasLotePorPeriodo: (
    dataInicio: string,
    dataFim: string
  ) => Promise<Object[]>;

  // Lotes (Ações de Status)

  concluirLote: (id: number | string) => Promise<boolean>;
  reabrirLote: (id: number | string) => Promise<LoteDetalheAPI>;
  recomecarLote: (id: number | string) => Promise<LoteDetalheAPI>;

  // Medições

  adicionarMedicao: (
    loteId: number | string,
    data: CriarMedicaoData
  ) => Promise<LoteDetalheAPI>;
  listarMedicoesLote: (loteId: number | string) => Promise<MedicaoAPI[]>;
  removerMedicao: (
    loteId: number | string,
    medicaoId: number | string
  ) => Promise<LoteDetalheAPI>;

  // Teste

  healthCheck: () => Promise<any>;
  getAllUsuarios: () => Promise<UsuarioDto[]>;
  pingAdmin: () => Promise<string>;
}

// ------------------------------------------------------------------
// --- 3. IMPLEMENTAÇÃO DO HOOK CUSTOMIZADO (COM NOVOS MÉTODOS) ---
// ------------------------------------------------------------------

export function useControleQualidadeApi(): IControleQualidadeApi {
  const { estaLogado } = useAutenticacao();

  const TIPOS_PECA_ENDPOINT = "/api/tipos-peca";
  const LOTES_ENDPOINT = "/api/lotes";

  const checkAuth = () => {
    if (!estaLogado) {
      console.error("Tentativa de chamada de API sem autenticação.");
      throw new Error("Usuário não autenticado. Favor fazer login.");
    }
  };

  /**
   * Função de mapeamento que converte o payload do formulário (TipoPecaFormPayload)
   * para o payload esperado pela API (CriarTipoPecaRequestData).
   * Renomeia 'dimensoes' para 'metadadosCotas' e garante o tipo correto dos campos.
   */

  // --- MÉTODOS DE TIPOS DE PEÇA (MANTIDOS E ATUALIZADOS) ---
  const pingAdmin = async (): Promise<string> => {
    checkAuth();
    const response: AxiosResponse<string> = await api.get(
      `${ADMIN_ENDPOINT}/ping`
    );
    return response.data;
  };

  // Mantenha apenas esta declaração:
  const getAllUsuarios = async (): Promise<UsuarioDto[]> => {
    checkAuth();

    const response: AxiosResponse<UsuarioDto[] | null> = await api.get(
      `${ADMIN_ENDPOINT}/usuarios`
    );

    // Tratamento 204 No Content
    if (response.status === 204) {
      return [];
    }

    return response.data || [];
  };
  const listarTiposPeca = async () => {
    if (!estaLogado) {
      console.warn(
        "Ignorando busca por tipos de peça: Usuário não autenticado (estado inicial)."
      );
      return [];
    }

    checkAuth(); // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${TIPOS_PECA_ENDPOINT}`);

    const response: AxiosResponse<TipoPecaAPI[]> = await api.get(
      TIPOS_PECA_ENDPOINT
    ); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${TIPOS_PECA_ENDPOINT}`, {
      data: response.data,
    });

    return response.data;
  };

  const obterTipoPeca = async (id: number | string) => {
    checkAuth();
    const response: AxiosResponse<TipoPecaAPI> = await api.get(
      `${TIPOS_PECA_ENDPOINT}/${id}`
    );
    return response.data;
  };

  // ✅ IMPLEMENTAÇÃO CORRIGIDA: Usa 'data' diretamente
  const atualizarTipoPeca = async (
    id: number | string,
    data: TipoPecaFormPayload
  ) => {
    checkAuth();
    const response: AxiosResponse<TipoPecaAPI> = await api.put(
      `${TIPOS_PECA_ENDPOINT}/${id}`,
      data // Envia diretamente o objeto no formato esperado pelo Java.
    );
    return response.data;
  };
  // ✅ IMPLEMENTAÇÃO CORRIGIDA: Usa 'data' diretamente, pois o payload já está no formato correto ({ nome, descricao, dimensoes: Array })
  const cadastrarTipoPeca = async (data: TipoPecaFormPayload) => {
    checkAuth();
    console.log(`[API TRACKING] POST: ${TIPOS_PECA_ENDPOINT}`, { data });
    const response: AxiosResponse<TipoPecaAPI> = await api.post(
      TIPOS_PECA_ENDPOINT,
      data // Envia diretamente o objeto no formato esperado pelo Java.
    );
    console.log(`[API RESPONSE] POST: ${TIPOS_PECA_ENDPOINT}`, {
      data: response.data,
    });
    return response.data;
  };

  const excluirTipoPeca = async (id: number | string) => {
    checkAuth();
    const url = `${TIPOS_PECA_ENDPOINT}/${id}`; // 🚀 LOG de requisição DELETE
    console.log(`[API TRACKING] DELETE: ${url}`);

    const response = await api.delete(url); // 🌟 LOG DE RETORNO (Geralmente vazio para DELETE)

    console.log(`[API RESPONSE] DELETE: ${url}`, { data: response.data });
  };

  const buscarTiposPeca = async (nome: string) => {
    checkAuth();
    const url = `${TIPOS_PECA_ENDPOINT}/buscar?nome=${nome}`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<TipoPecaAPI[]> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const obterTiposComLotes = async () => {
    checkAuth();
    const url = `${TIPOS_PECA_ENDPOINT}/com-lotes`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<TipoPecaAPI[]> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const obterEstatisticasUsoTipoPeca = async () => {
    checkAuth();
    const url = `${TIPOS_PECA_ENDPOINT}/estatisticas/uso`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<Object[]> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const getTemplateMedicao = async (id: number | string) => {
    checkAuth();
    const url = `${TIPOS_PECA_ENDPOINT}/${id}/template-medicao`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<any> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const healthCheck = async () => {
    checkAuth();
    const url = `${TIPOS_PECA_ENDPOINT}/health`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  // --- MÉTODOS DE LOTE (MANTIDOS) ---

  const listarLotesResumido = async () => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/todos`; // Rota que lista TODOS
    console.log(`[API TRACKING] GET: ${url} (Todos Lotes)`);

    const response: AxiosResponse<LoteResumidoAPI[]> = await api.get(url);

    console.log(`[API RESPONSE] GET: ${url}`, {
      data: response.data,
    });

    return response.data;
  };

  const listarLotesDoUsuario = async () => {
    checkAuth();
    console.log(`[API TRACKING] GET: ${LOTES_ENDPOINT} (Lotes do Usuário)`); // GET: /api/lotes

    const response: AxiosResponse<LoteResumidoAPI[]> = await api.get(
      LOTES_ENDPOINT
    ); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${LOTES_ENDPOINT}`, {
      data: response.data,
    });

    return response.data;
  };

  const obterDetalheLote = async (id: number | string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${id}`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<LoteDetalheAPI> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const criarLote = async (data: CriarLoteRequestData) => {
    checkAuth(); // 🚀 LOG de requisição POST (com dados)
    console.log(`[API TRACKING] POST: ${LOTES_ENDPOINT}`, { data });

    const response: AxiosResponse<LoteDetalheAPI> = await api.post(
      LOTES_ENDPOINT,
      data
    ); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] POST: ${LOTES_ENDPOINT}`, {
      data: response.data,
    });

    return response.data;
  };

  const atualizarLote = async (id: number | string, data: any) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${id}`; // 🚀 LOG de requisição PUT (com dados)
    console.log(`[API TRACKING] PUT: ${url}`, { data });

    const response: AxiosResponse<LoteDetalheAPI> = await api.put(url, data); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] PUT: ${url}`, { data: response.data });

    return response.data;
  };

  const excluirLote = async (id: number | string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${id}`; // 🚀 LOG de requisição DELETE
    console.log(`[API TRACKING] DELETE: ${url}`);

    const response = await api.delete(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] DELETE: ${url}`, { data: response.data });
  };

  const obterDashboard = async () => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/dashboard`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<DashboardAPI> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const listarLotesPorStatus = async (status: string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/status/${status}`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<LoteResumidoAPI[]> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const buscarLotes = async (descricao: string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/buscar?descricao=${descricao}`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<LoteResumidoAPI[]> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const obterEstatisticasLotePorPeriodo = async (
    dataInicio: string,
    dataFim: string
  ) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/estatisticas/periodo?dataInicio=${dataInicio}&dataFim=${dataFim}`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<Object[]> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const concluirLote = async (id: number | string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${id}/concluir`; // 🚀 LOG de requisição PATCH
    console.log(`[API TRACKING] PATCH: ${url}`);

    const response: AxiosResponse<LoteDetalheAPI> = await api.patch(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] PATCH: ${url}`, { data: response.data }); // Retorna true se a requisição foi bem-sucedida (status 200-299)

    return response.status >= 200 && response.status < 300;
  };

  const reabrirLote = async (id: number | string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${id}/reabrir`; // 🚀 LOG de requisição PATCH
    console.log(`[API TRACKING] PATCH: ${url}`);

    const response: AxiosResponse<LoteDetalheAPI> = await api.patch(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] PATCH: ${url}`, { data: response.data });

    return response.data;
  };

  const recomecarLote = async (id: number | string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${id}/recomecar`; // 🚀 LOG de requisição PATCH
    console.log(`[API TRACKING] PATCH: ${url} (Recomeçar Lote)`);

    const response: AxiosResponse<LoteDetalheAPI> = await api.patch(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] PATCH: ${url}`, { data: response.data });

    return response.data;
  };

  // --- MÉTODOS DE MEDIÇÃO ---
  const adicionarMedicao = async (
    loteId: number | string,
    data: CriarMedicaoData
  ) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${loteId}/medicoes`; // 🚀 LOG CRÍTICO: Método, URL e dados enviados (payload)
    console.log(`[API TRACKING] POST: ${url}`, { data });

    const response: AxiosResponse<LoteDetalheAPI> = await api.post(url, data); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] POST: ${url}`, { data: response.data });

    return response.data;
  };
  const listarMedicoesLote = async (loteId: number | string) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${loteId}/medicoes`; // 🚀 LOG de requisição GET
    console.log(`[API TRACKING] GET: ${url}`);

    const response: AxiosResponse<MedicaoAPI[]> = await api.get(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] GET: ${url}`, { data: response.data });

    return response.data;
  };

  const removerMedicao = async (
    loteId: number | string,
    medicaoId: number | string
  ) => {
    checkAuth();
    const url = `${LOTES_ENDPOINT}/${loteId}/medicoes/${medicaoId}`; // 🚀 LOG de requisição DELETE
    console.log(`[API TRACKING] DELETE: ${url}`);

    const response: AxiosResponse<LoteDetalheAPI> = await api.delete(url); // 🌟 LOG DE RETORNO

    console.log(`[API RESPONSE] DELETE: ${url}`, { data: response.data });

    return response.data;
  };

  return useMemo(
    () => ({
      // Tipos de Peça
      listarTiposPeca,
      obterTipoPeca,
      cadastrarTipoPeca, // ATUALIZADO
      atualizarTipoPeca,
      excluirTipoPeca,
      buscarTiposPeca,
      obterTiposComLotes,
      obterEstatisticasUsoTipoPeca,
      getTemplateMedicao,
      healthCheck,
      getAllUsuarios,
      pingAdmin,

      // Lotes

      listarLotesResumido,
      listarLotesDoUsuario,
      obterDetalheLote,
      criarLote,
      atualizarLote,
      excluirLote,
      obterDashboard,

      // Lotes (Filtros)

      listarLotesPorStatus,
      buscarLotes,
      obterEstatisticasLotePorPeriodo,

      // Lotes (Ações)

      concluirLote,
      reabrirLote,
      recomecarLote,

      // Medições

      adicionarMedicao,
      listarMedicoesLote,
      removerMedicao,
    }),
    [estaLogado]
  );
}
