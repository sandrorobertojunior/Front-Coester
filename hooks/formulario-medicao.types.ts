// formulario-medicao.types.ts (ADAPTADO PARA FLUXO DE LOTE)

// =================================================================
// --- TIPOS BASE (Campos, Especificações e Medições Acumuladas) ---
// =================================================================

/**
 * Define a estrutura de um campo/cota no formulário, derivada dos metadados da API.
 */
export interface CampoPeca {
  nome: string;
  label: string;
  tipo: "number" | "text"; // Simplificado, excluindo 'checkbox' do formulário de medição de valor
  obrigatorio: boolean;
  min?: number; // Calculado: valorPadrao - tolerancia
  max?: number; // Calculado: valorPadrao + tolerancia
  step?: number; // Calculado para facilitar a entrada
}

/**
 * Define as especificações de tolerância para um campo numérico.
 */
export interface EspecificacaoCampo {
  min: number; // Valor mínimo aceitável (Valor Padrão - Tolerância)
  max: number; // Valor máximo aceitável (Valor Padrão + Tolerância)
  tolerancia: number;
}

/**
 * Define o tipo de peça no contexto do formulário (derivado do LoteDetalheAPI.tipoPeca).
 * Nota: 'pecasNoLote' será movido para IFormularioMedicaoViewProps, pois é uma propriedade do LOTE, não do Tipo de Peça.
 */
export interface TipoPeca {
  id: string; // ID da peça (ex: 1, mapeado de number para string)
  nome: string;
  campos: CampoPeca[];
  especificacoes: Record<string, EspecificacaoCampo>;
}

/**
 * Estrutura para o registro de uma medição individual no histórico local.
 */
export interface MedicaoPeca {
  numeroPeca: number;
  valores: Record<string, string>; // Valores de medição (mantidos como string para campos de texto/número)
  observacoes: string;
  dataHora: Date;
}

// Novos Tipos de Modo de Preenchimento
export type ModoPreenchimento = "peca-a-peca" | "cota-a-cota";

// =================================================================
// --- INTERFACES DE API (Apenas para referência, o real está no useControleQualidadeApi.ts) ---
// =================================================================

import {
  LoteResumidoAPI,
  LoteDetalheAPI,
} from "../contextos/api/controlequalidade"; // Importa os tipos da API real

export interface IControleQualidadeApi {
  // A interface do seu hook da API real deve ser usada, mas mantemos
  // esta aqui para clareza: ela se refere ao contrato real do hook.
  // ...
}

// =================================================================
// --- INTERFACE DE PROPRIEDADES DE VISUALIZAÇÃO (VIEW PROPS) ---
// =================================================================

/**
 * O estado completo que será passado do Hook para o Componente de Visualização.
 * Totalmente reestruturado para ser baseado na Seleção de Lote.
 */
export interface IFormularioMedicaoViewProps {
  // --- Estado de Configuração do Lote ---

  // Lista de lotes disponíveis para seleção (Ex: LOTE-880783, LOTE-992341)
  lotesDisponiveis: LoteResumidoAPI[]; // Estado de carregamento dos lotes

  carregandoLotes: boolean; // Anteriormente 'carregandoTiposPecas' // ID do lote selecionado atualmente. Null = nenhuma seleção.

  loteSelecionadoId: number | null; // Anteriormente 'tipoPecaSelecionadaId' // Detalhes da Peça e Especificação (Derivados do lote)

  tipoPeca?: TipoPeca; // Detalhes do tipo de peça do lote (Comprimento, Diâmetro, etc.)
  pecasNoLote: number; // Quantidade de amostras a medir (do LoteDetalheAPI) // Modo de preenchimento escolhido

  modo: ModoPreenchimento | null; // --- Estado de Preenchimento da Medição ---

  pecaAtual: number;
  cotaAtual?: CampoPeca; // A cota atual sendo preenchida (útil para navegação nos modos)
  valores: Record<string, string>;
  observacoes: string;
  erros: Record<string, string>;
  medicoesAcumuladas: MedicaoPeca[]; // --- Estado de Ação e Usuário ---

  salvando: boolean;
  loteCompletado?: boolean; // REMOVA ESTE
  loteAprovado: boolean | null; // ADICIONE ESTE
  usuarioNome: string; // Ex: "sandro" // --- Handlers --- // NOVO Handler: Define o lote, que dispara a busca por TipoPeca/Cotas

  setLoteSelecionadoId: (id: number | null) => Promise<void>;

  setModo: (modo: ModoPreenchimento) => void;
  atualizarValor: (campo: string, valor: string) => void;
  setObservacoes: (obs: string) => void;
  salvarMedicao: () => Promise<void>;
  resetarFormulario: () => void;
  existeErroCritico: () => boolean;
  verificarEspecificacao: (
    nomeCampo: string,
    valor: string
  ) => "aprovado" | "fora-spec" | "info"; // Propriedade do container
  onVoltar?: () => void;
  recomecarMedicao: () => Promise<void>;
  cancelarMedicao: () => Promise<void>;
}
