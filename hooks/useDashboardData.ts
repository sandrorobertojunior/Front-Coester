// src/hooks/useDashboardData.ts

import { useState, useEffect, useCallback } from "react";
import {
  useControleQualidadeApi,
  UsuarioDto,
  TipoPecaResponse, // [CORREÇÃO] Usando o tipo de resposta correto
  DashboardResponse,
} from "@/contextos/api/controlequalidade"; // AJUSTE O PATH DA SUA API

// --- INTERFACE DE RETORNO DO HOOK ---
// Descreve tudo que o hook fornecerá para o componente
interface DashboardData {
  dashboard: DashboardResponse | null;
  usuarios: UsuarioDto[];
  tiposPecas: TipoPecaResponse[];

  carregando: boolean; // Um único estado de 'loading' geral
  erro: string | null; // Um único estado de erro geral

  recarregarDashboard: () => void;
}

// Estado inicial para o dashboard
const ESTADO_INICIAL_DASHBOARD: DashboardResponse = {
  totalLotes: 0,
  lotesEmAndamento: 0,
  lotesConcluidos: 0,
  taxaAprovacaoGeral: 0,
  tempoMedioMedicaoMinutos: 0,
  lotesRecentes: [],
};

export function useDashboardData(): DashboardData {
  const api = useControleQualidadeApi();

  // --- ESTADOS PRINCIPAIS DO HOOK ---
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([]);
  const [tiposPecas, setTiposPecas] = useState<TipoPecaResponse[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // --- FUNÇÃO PARA CARREGAR TODOS OS DADOS ---
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      // Busca todos os dados em paralelo para mais eficiência
      const [dadosDashboard, dadosUsuarios, dadosTiposPeca] = await Promise.all(
        [api.obterDashboard(), api.getAllUsuarios(), api.listarTiposPeca()]
      );

      setDashboard(dadosDashboard);
      setUsuarios(dadosUsuarios);
      setTiposPecas(dadosTiposPeca);
    } catch (error: any) {
      console.error("Falha ao carregar dados do dashboard:", error);
      const mensagemErro =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      setErro(mensagemErro);
    } finally {
      setCarregando(false);
    }
  }, [api]);

  // Carrega os dados quando o hook é montado pela primeira vez
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // --- RETORNO DO HOOK ---
  return {
    // Se o dashboard ainda não carregou, retorna o estado inicial para evitar erros de 'null' no componente
    dashboard: dashboard || ESTADO_INICIAL_DASHBOARD,
    usuarios,
    tiposPecas,
    carregando,
    erro,
    recarregarDashboard: carregarDados, // A função de recarregar agora é a mesma que carrega tudo
  };
}
