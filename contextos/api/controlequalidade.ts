// src/contextos/api/controlequalidade.types.ts

// ------------------------------------------------------------------
// --- 1. INTERFACES DE RESPOSTA DA API (DTOs - Baseado nos 'Response' Records do Java) ---
// ------------------------------------------------------------------

/**
 * Representa um usuário do sistema. (Baseado em UsuarioDto)
 */
export interface UsuarioDto {
  id: number;
  username: string;
  email: string;
}

/**
 * Metadados para uma cota (dimensão). (Baseado em CotaMetadata)
 */
export interface CotaMetadata {
  nome: string;
  label: string;
  tipo: "number" | "text";
  unidade: string;
  tolerancia?: number;
  valorPadrao?: number;
}

/**
 * Resposta para um Tipo de Peça. (Baseado em TipoPecaResponse)
 */
export interface TipoPecaResponse {
  id: number;
  nome: string;
  descricao: string;
  metadadosCotas: CotaMetadata[];
}

/**
 * Resposta para uma Medição. (Baseado em MedicaoResponse)
 */
export interface MedicaoResponse {
  id: number;
  data: string; // LocalDateTime será string ISO 8601
  pecaNumero: number;
  dimensoes: Record<string, number>;
  status: "APROVADO" | "REPROVADO";
  observacoes: string;
}

/**
 * Resposta detalhada de um Lote. (Baseado em LoteResponse)
 */
export interface LoteResponse {
  id: number;
  codigoLote: string;
  descricao: string;
  tipoPeca: TipoPecaResponse;
  quantidadePecas: number;
  quantidadeAmostrasDesejada: number;
  porcentagemAmostragem: number;
  pecasAprovadas: number;
  pecasReprovadas: number;
  taxaAprovacao: number;
  status: string;
  dataCriacao: string; // LocalDateTime será string ISO 8601
  medicoes: MedicaoResponse[];
}

/**
 * Resposta resumida de um Lote. (Baseado em LoteResumidoResponse)
 */
export interface LoteResumidoResponse {
  id: number;
  codigoLote: string;
  descricao: string;
  tipoPeca: TipoPecaResponse;
  quantidadePecas: number;
  quantidadeAmostrasDesejada: number;
  porcentagemAmostragem: number;
  pecasAprovadas: number;
  pecasReprovadas: number;
  taxaAprovacao: number;
  status: string;
  dataCriacao: string; // LocalDateTime será string ISO 8601
}

/**
 * Resposta do Dashboard. (Baseado em DashboardResponse)
 */
export interface DashboardResponse {
  totalLotes: number;
  lotesEmAndamento: number;
  lotesConcluidos: number;
  taxaAprovacaoGeral: number;
  tempoMedioMedicaoMinutos: number;
  lotesRecentes: LoteResumidoResponse[];
}

/**
 * Resposta do login. (Baseado em UsuarioLoginResponse)
 */
export interface UsuarioLoginResponse {
  basicToken: string | null;
  nome: string | null;
  roles: string[] | null;
}

// ------------------------------------------------------------------
// --- 2. INTERFACES DE REQUISIÇÃO DA API (Payloads - Baseado nos 'Request' Records do Java) ---
// ------------------------------------------------------------------

/**
 * Payload para CRIAR um novo Tipo de Peça. (Baseado em CriarTipoPecaRequest)
 * O frontend trabalha com um array de objetos, mas a API espera um JSON. A conversão é feita no hook.
 */
export interface CriarTipoPecaRequest {
  nome: string;
  descricao: string;
  dimensoes: CotaMetadata[];
}

/**
 * Payload para ATUALIZAR um Lote. (Baseado em AtualizarLoteRequest)
 */
export interface AtualizarLoteRequest {
  descricao: string;
  observacoes?: string;
}

/**
 * Payload para CRIAR um novo Lote. (Baseado em CriarLoteRequest)
 */
export interface CriarLoteRequest {
  // codigoLote não é enviado, é gerado no backend
  descricao: string;
  tipoPecaId: number;
  quantidadePecas: number;
  quantidadeAmostrasDesejada?: number;
  observacoes?: string;
}

/**
 * Payload para ADICIONAR uma nova Medição a um Lote. (Baseado em AdicionarMedicaoRequestParameter)
 */
export interface AdicionarMedicaoRequest {
  dimensoes: Record<string, number>;
  observacoes?: string;
}

import { useMemo, useCallback } from "react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import api from "@/contextos/api/api"; // Cliente Axios configurado

// --- CONTRATO DO HOOK (A interface que ele expõe) ---
export interface IControleQualidadeApi {
  // Tipos de Peça
  listarTiposPeca: () => Promise<TipoPecaResponse[]>;
  obterTipoPeca: (id: number | string) => Promise<TipoPecaResponse>;
  cadastrarTipoPeca: (data: CriarTipoPecaRequest) => Promise<TipoPecaResponse>;
  atualizarTipoPeca: (
    id: number | string,
    data: CriarTipoPecaRequest
  ) => Promise<TipoPecaResponse>;
  excluirTipoPeca: (id: number | string) => Promise<void>;
  buscarTiposPeca: (nome: string) => Promise<TipoPecaResponse[]>;
  obterTiposComLotes: () => Promise<TipoPecaResponse[]>;
  obterEstatisticasUsoTipoPeca: () => Promise<Object[]>;
  getTemplateMedicao: (id: number | string) => Promise<any>;

  // Lotes
  listarTodosOsLotes: () => Promise<LoteResumidoResponse[]>; // Admin
  listarLotesDoUsuario: () => Promise<LoteResumidoResponse[]>;
  obterDetalheLote: (id: number | string) => Promise<LoteResponse>;
  criarLote: (data: CriarLoteRequest) => Promise<LoteResponse>;
  atualizarLote: (
    id: number | string,
    data: AtualizarLoteRequest
  ) => Promise<LoteResponse>;
  excluirLote: (id: number | string) => Promise<void>;
  obterDashboard: () => Promise<DashboardResponse>;
  listarLotesPorStatus: (status: string) => Promise<LoteResumidoResponse[]>;
  buscarLotes: (descricao: string) => Promise<LoteResumidoResponse[]>;
  obterEstatisticasLotePorPeriodo: (
    dataInicio: string,
    dataFim: string
  ) => Promise<Object[]>;

  // Ações de Status de Lote
  concluirLote: (id: number | string) => Promise<boolean>;
  reabrirLote: (id: number | string) => Promise<LoteResponse>;
  recomecarLote: (id: number | string) => Promise<LoteResponse>;

  // Medições
  adicionarMedicao: (
    loteId: number | string,
    data: AdicionarMedicaoRequest
  ) => Promise<LoteResponse>;
  listarMedicoesLote: (loteId: number | string) => Promise<MedicaoResponse[]>;
  removerMedicao: (
    loteId: number | string,
    medicaoId: number | string
  ) => Promise<LoteResponse>;

  // Teste
  healthCheck: () => Promise<any>;
  getAllUsuarios: () => Promise<UsuarioDto[]>;
  pingAdmin: () => Promise<string>;
}
// --- IMPLEMENTAÇÃO DO HOOK COM LOGS ---
export function useControleQualidadeApi(): IControleQualidadeApi {
  const { estaLogado } = useAutenticacao();

  const checkAuth = useCallback(() => {
    if (!estaLogado) {
      throw new Error("Usuário não autenticado.");
    }
  }, [estaLogado]);

  const apiFunctions: IControleQualidadeApi = useMemo(
    () => ({
      // --- Tipos de Peça ---
      cadastrarTipoPeca: async (data) => {
        checkAuth();
        console.log("[API REQ] POST /api/tipos-peca", { payload: data });
        const response = await api.post<TipoPecaResponse>(
          "/api/tipos-peca",
          data
        );
        console.log("[API RES] POST /api/tipos-peca", {
          response: response.data,
        });
        return response.data;
      },
      listarTiposPeca: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/tipos-peca");
        const response = await api.get<TipoPecaResponse[]>("/api/tipos-peca");
        console.log("[API RES] GET /api/tipos-peca", {
          response: response.data,
        });
        return response.data;
      },
      obterTipoPeca: async (id) => {
        checkAuth();
        console.log(`[API REQ] GET /api/tipos-peca/${id}`);
        const response = await api.get<TipoPecaResponse>(
          `/api/tipos-peca/${id}`
        );
        console.log(`[API RES] GET /api/tipos-peca/${id}`, {
          response: response.data,
        });
        return response.data;
      },
      atualizarTipoPeca: async (id, data) => {
        checkAuth();
        console.log(`[API REQ] PUT /api/tipos-peca/${id}`, { payload: data });
        const response = await api.put<TipoPecaResponse>(
          `/api/tipos-peca/${id}`,
          data
        );
        console.log(`[API RES] PUT /api/tipos-peca/${id}`, {
          response: response.data,
        });
        return response.data;
      },
      excluirTipoPeca: async (id) => {
        checkAuth();
        console.log(`[API REQ] DELETE /api/tipos-peca/${id}`);
        await api.delete(`/api/tipos-peca/${id}`);
        console.log(`[API RES] DELETE /api/tipos-peca/${id}`, {
          status: "success",
        });
      },
      buscarTiposPeca: async (nome) => {
        checkAuth();
        console.log("[API REQ] GET /api/tipos-peca/buscar", {
          params: { nome },
        });
        const response = await api.get<TipoPecaResponse[]>(
          "/api/tipos-peca/buscar",
          { params: { nome } }
        );
        console.log("[API RES] GET /api/tipos-peca/buscar", {
          response: response.data,
        });
        return response.data;
      },
      obterTiposComLotes: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/tipos-peca/com-lotes");
        const response = await api.get<TipoPecaResponse[]>(
          "/api/tipos-peca/com-lotes"
        );
        console.log("[API RES] GET /api/tipos-peca/com-lotes", {
          response: response.data,
        });
        return response.data;
      },
      obterEstatisticasUsoTipoPeca: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/tipos-peca/estatisticas/uso");
        const response = await api.get<Object[]>(
          "/api/tipos-peca/estatisticas/uso"
        );
        console.log("[API RES] GET /api/tipos-peca/estatisticas/uso", {
          response: response.data,
        });
        return response.data;
      },
      getTemplateMedicao: async (id) => {
        checkAuth();
        console.log(`[API REQ] GET /api/tipos-peca/${id}/template-medicao`);
        const response = await api.get<any>(
          `/api/tipos-peca/${id}/template-medicao`
        );
        console.log(`[API RES] GET /api/tipos-peca/${id}/template-medicao`, {
          response: response.data,
        });
        return response.data;
      },
      healthCheck: async () => {
        console.log("[API REQ] GET /api/tipos-peca/health");
        const response = await api.get<string>("/api/tipos-peca/health");
        console.log("[API RES] GET /api/tipos-peca/health", {
          response: response.data,
        });
        return response.data;
      },

      // --- Lotes ---
      criarLote: async (data) => {
        checkAuth();
        console.log("[API REQ] POST /api/lotes", { payload: data });
        const response = await api.post<LoteResponse>("/api/lotes", data);
        console.log("[API RES] POST /api/lotes", { response: response.data });
        return response.data;
      },
      listarTodosOsLotes: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/lotes/todos");
        const response = await api.get<LoteResumidoResponse[]>(
          "/api/lotes/todos"
        );
        console.log("[API RES] GET /api/lotes/todos", {
          response: response.data,
        });
        return response.data;
      },
      listarLotesDoUsuario: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/lotes");
        const response = await api.get<LoteResumidoResponse[]>("/api/lotes");
        console.log("[API RES] GET /api/lotes", { response: response.data });
        return response.data;
      },
      obterDetalheLote: async (id) => {
        checkAuth();
        console.log(`[API REQ] GET /api/lotes/${id}`);
        const response = await api.get<LoteResponse>(`/api/lotes/${id}`);
        console.log(`[API RES] GET /api/lotes/${id}`, {
          response: response.data,
        });
        return response.data;
      },
      atualizarLote: async (id, data) => {
        checkAuth();
        console.log(`[API REQ] PUT /api/lotes/${id}`, { payload: data });
        const response = await api.put<LoteResponse>(`/api/lotes/${id}`, data);
        console.log(`[API RES] PUT /api/lotes/${id}`, {
          response: response.data,
        });
        return response.data;
      },
      excluirLote: async (id) => {
        checkAuth();
        console.log(`[API REQ] DELETE /api/lotes/${id}`);
        await api.delete(`/api/lotes/${id}`);
        console.log(`[API RES] DELETE /api/lotes/${id}`, { status: "success" });
      },
      listarLotesPorStatus: async (status) => {
        checkAuth();
        console.log(`[API REQ] GET /api/lotes/status/${status}`);
        const response = await api.get<LoteResumidoResponse[]>(
          `/api/lotes/status/${status}`
        );
        console.log(`[API RES] GET /api/lotes/status/${status}`, {
          response: response.data,
        });
        return response.data;
      },
      buscarLotes: async (descricao) => {
        checkAuth();
        console.log("[API REQ] GET /api/lotes/buscar", {
          params: { descricao },
        });
        const response = await api.get<LoteResumidoResponse[]>(
          "/api/lotes/buscar",
          { params: { descricao } }
        );
        console.log("[API RES] GET /api/lotes/buscar", {
          response: response.data,
        });
        return response.data;
      },

      // --- Ações de Status ---
      concluirLote: async (id) => {
        checkAuth();
        console.log(`[API REQ] PATCH /api/lotes/${id}/concluir`);
        const response = await api.patch<boolean>(`/api/lotes/${id}/concluir`);
        console.log(`[API RES] PATCH /api/lotes/${id}/concluir`, {
          response: response.data,
        });
        return response.data;
      },
      reabrirLote: async (id) => {
        checkAuth();
        console.log(`[API REQ] PATCH /api/lotes/${id}/reabrir`);
        const response = await api.patch<LoteResponse>(
          `/api/lotes/${id}/reabrir`
        );
        console.log(`[API RES] PATCH /api/lotes/${id}/reabrir`, {
          response: response.data,
        });
        return response.data;
      },
      recomecarLote: async (id) => {
        checkAuth();
        console.log(`[API REQ] PATCH /api/lotes/${id}/recomecar`);
        const response = await api.patch<LoteResponse>(
          `/api/lotes/${id}/recomecar`
        );
        console.log(`[API RES] PATCH /api/lotes/${id}/recomecar`, {
          response: response.data,
        });
        return response.data;
      },

      // --- Dashboard e Estatísticas ---
      obterDashboard: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/lotes/dashboard");
        const response = await api.get<DashboardResponse>(
          "/api/lotes/dashboard"
        );
        console.log("[API RES] GET /api/lotes/dashboard", {
          response: response.data,
        });
        return response.data;
      },
      obterEstatisticasLotePorPeriodo: async (dataInicio, dataFim) => {
        checkAuth();
        console.log("[API REQ] GET /api/lotes/estatisticas/periodo", {
          params: { dataInicio, dataFim },
        });
        const response = await api.get<Object[]>(
          "/api/lotes/estatisticas/periodo",
          { params: { dataInicio, dataFim } }
        );
        console.log("[API RES] GET /api/lotes/estatisticas/periodo", {
          response: response.data,
        });
        return response.data;
      },

      // --- Medições ---
      adicionarMedicao: async (loteId, data) => {
        checkAuth();
        console.log(`[API REQ] POST /api/lotes/${loteId}/medicoes`, {
          payload: data,
        });
        const response = await api.post<LoteResponse>(
          `/api/lotes/${loteId}/medicoes`,
          data
        );
        console.log(`[API RES] POST /api/lotes/${loteId}/medicoes`, {
          response: response.data,
        });
        return response.data;
      },
      listarMedicoesLote: async (loteId) => {
        checkAuth();
        console.log(`[API REQ] GET /api/lotes/${loteId}/medicoes`);
        const response = await api.get<MedicaoResponse[]>(
          `/api/lotes/${loteId}/medicoes`
        );
        console.log(`[API RES] GET /api/lotes/${loteId}/medicoes`, {
          response: response.data,
        });
        return response.data;
      },
      removerMedicao: async (loteId, medicaoId) => {
        checkAuth();
        console.log(
          `[API REQ] DELETE /api/lotes/${loteId}/medicoes/${medicaoId}`
        );
        const response = await api.delete<LoteResponse>(
          `/api/lotes/${loteId}/medicoes/${medicaoId}`
        );
        console.log(
          `[API RES] DELETE /api/lotes/${loteId}/medicoes/${medicaoId}`,
          { response: response.data }
        );
        return response.data;
      },

      // --- Admin ---
      getAllUsuarios: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/admin/usuarios");
        const response = await api.get<UsuarioDto[]>("/api/admin/usuarios");
        const data = response.status === 204 ? [] : response.data;
        console.log("[API RES] GET /api/admin/usuarios", { response: data });
        return data;
      },
      pingAdmin: async () => {
        checkAuth();
        console.log("[API REQ] GET /api/admin/ping");
        const response = await api.get<string>("/api/admin/ping");
        console.log("[API RES] GET /api/admin/ping", {
          response: response.data,
        });
        return response.data;
      },
    }),
    [checkAuth]
  );

  return apiFunctions;
}
