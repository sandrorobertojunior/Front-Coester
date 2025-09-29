// src/hooks/useDashboardData.ts

import { useState, useEffect, useCallback } from "react";
import {
  useControleQualidadeApi,
  TipoPecaAPI,
  UsuarioDto, // Importado da sua API de administração
} from "@/contextos/api/controlequalidade"; // AJUSTE O PATH DA SUA API

// --- Tipos de Dados Estáticos ---

const estatisticasEstaticas = {
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

// 1. Definição da interface para os Alertas (Corrige o erro ts(703))
interface Alerta {
  id: string;
  tipo: string;
  descricao: string;
  severidade: "alta" | "media" | "baixa";
  usuario: string;
  dataHora: string;
}

// 2. Tipagem explícita para o array de alertas
const alertasEstaticos: Alerta[] = [
  {
    id: "1",
    tipo: "Taxa de Reprovação Alta",
    descricao: "Engrenagens com 8.2% de reprovação esta semana",
    severidade: "alta",
    usuario: "Pedro Costa",
    dataHora: "2024-01-15 10:30",
  },
];

interface DashboardData {
  estatisticas: typeof estatisticasEstaticas;
  alertas: Alerta[]; // Usando o novo tipo Alerta[]

  // NOVOS CAMPOS PARA DADOS REAIS DE USUÁRIOS
  usuarios: UsuarioDto[]; // Usa o DTO da API de Admin
  carregandoUsuarios: boolean;
  erroUsuarios: string | null;
  recarregarUsuarios: () => void;

  tiposPecas: TipoPecaAPI[];
  carregandoTiposPecas: boolean;
  erroTiposPecas: string | null;
  recarregarTiposPecas: () => void;

  recarregarDashboard: () => void;
}

export function useDashboardData(): DashboardData {
  const api = useControleQualidadeApi();

  // --- ESTADOS PARA TIPOS DE PEÇA ---
  const [tiposPecas, setTiposPecas] = useState<TipoPecaAPI[]>([]);
  const [carregandoTiposPecas, setCarregandoTiposPecas] = useState(true);
  const [erroTiposPecas, setErroTiposPecas] = useState<string | null>(null);

  // --- ESTADOS PARA USUÁRIOS (API ADMIN) ---
  const [apiUsuarios, setApiUsuarios] = useState<UsuarioDto[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [erroUsuarios, setErroUsuarios] = useState<string | null>(null);

  // --------------------------------------------------------
  // FUNÇÃO PARA CARREGAR TIPOS DE PEÇA
  // --------------------------------------------------------
  const carregarTiposPecas = useCallback(async () => {
    setCarregandoTiposPecas(true);
    setErroTiposPecas(null);
    try {
      const data = await api.listarTiposPeca();
      setTiposPecas(data);
    } catch (error) {
      console.error("Falha ao carregar tipos de peça:", error);
      setErroTiposPecas(
        "Não foi possível carregar os tipos de peça. Verifique a API."
      );
    } finally {
      setCarregandoTiposPecas(false);
    }
  }, [api]);

  // --------------------------------------------------------
  // FUNÇÃO PARA CARREGAR USUÁRIOS (ADMIN API)
  // --------------------------------------------------------
  const carregarUsuarios = useCallback(async () => {
    setCarregandoUsuarios(true);
    setErroUsuarios(null);
    try {
      // Chamada do novo endpoint de administração: GET /api/admin/usuarios
      const data = await api.getAllUsuarios();
      setApiUsuarios(data);
    } catch (error) {
      console.error("Falha ao carregar lista de usuários da Admin API:", error);

      // Captura a mensagem de erro da API (e.g., "Acesso negado. Você não possui...")
      setErroUsuarios(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar usuários. Verifique sua permissão de Administrador."
      );
      setApiUsuarios([]);
    } finally {
      setCarregandoUsuarios(false);
    }
  }, [api]);

  // --------------------------------------------------------
  // FUNÇÃO DE RECARREGAMENTO GERAL
  // --------------------------------------------------------
  const recarregarDashboard = useCallback(() => {
    // Carrega todos os dados necessários
    carregarTiposPecas();
    carregarUsuarios(); // <-- Incluído o carregamento dos usuários
  }, [carregarTiposPecas, carregarUsuarios]);

  useEffect(() => {
    // Carrega os dados ao montar o componente
    recarregarDashboard();
  }, [recarregarDashboard]);

  // --------------------------------------------------------
  // RETORNO DO HOOK
  // --------------------------------------------------------
  return {
    // Dados estáticos
    estatisticas: estatisticasEstaticas,
    alertas: alertasEstaticos,

    // Dados reais (API) - Tipos de Peça
    tiposPecas,
    carregandoTiposPecas,
    erroTiposPecas,
    recarregarTiposPecas: carregarTiposPecas,

    // Dados reais (API Admin) - Usuários
    usuarios: apiUsuarios,
    carregandoUsuarios: carregandoUsuarios,
    erroUsuarios: erroUsuarios,
    recarregarUsuarios: carregarUsuarios, // Exposição do handler específico

    // Função de recarregamento geral
    recarregarDashboard,
  };
}
