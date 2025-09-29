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
  Loader2,
} from "lucide-react";
import { useAutenticacao, Usuario } from "@/contextos/contexto-autenticacao";
import {
  useControleQualidadeApi,
  LoteResumidoAPI,
  TipoPecaAPI,
  CriarLoteRequestData,
  TipoPecaFormPayload,
  DimensaoRequest,
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

type TipoCampo = "number" | "text";

export interface Dimensao {
  nome: string;
  label: string;
  tipo: TipoCampo;
  unidade?: string;
  obrigatorio?: boolean;
  valorPadrao?: number;
  tolerancia?: number;
}

interface TipoPecaLote {
  id: number;
  nome: string;
  descricao: string;
}

export interface TipoPecaFormData {
  nome: string;
  descricao: string;
  dimensoes: Dimensao[];
}

export interface TipoPeca {
  id: string; // Mudando para string para refletir o TipoPecaAPI se for o caso
  nome: string;
  descricao: string;
  dimensoes: Dimensao[];
  ativo: boolean;
  criadoEm: string;
  criadoPor: string;
  totalMedicoes: number;
}

interface DialogTipoPecaProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: TipoPecaFormData;
  setFormData: React.Dispatch<React.SetStateAction<TipoPecaFormData>>;
  novoCampo: Dimensao;
  setNovoCampo: React.Dispatch<React.SetStateAction<Dimensao>>;
  adicionarCampo: () => void;
  removerCampo: (index: number) => void;
  onSalvoComSucesso: () => void;
  /** ID do Tipo de Peça se estivermos em modo de edição, ou null/undefined se for criação. */
  tipoPecaIdParaEdicao?: number | string | null; // Adicionado para distinguir entre CADASTRAR e ATUALIZAR
}

export function DialogTipoPeca({
  open,
  setOpen,
  formData,
  setFormData,
  novoCampo,
  setNovoCampo,
  adicionarCampo,
  removerCampo,
  onSalvoComSucesso,
  tipoPecaIdParaEdicao, // <--- Novo prop
}: DialogTipoPecaProps) {
  // Importação corrigida: adicionando atualizarTipoPeca
  const { cadastrarTipoPeca, atualizarTipoPeca } = useControleQualidadeApi();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdicao = !!tipoPecaIdParaEdicao; // Verifica se estamos no modo de edição

  const isFormValid =
    formData.nome.trim() !== "" && formData.dimensoes.length > 0;

  const handleUpdateEspecificacao = (
    index: number,
    tipo: "valorPadrao" | "tolerancia",
    valorString: string
  ) => {
    setFormData((prev) => {
      const novasDimensoes = [...prev.dimensoes];
      const dimensao = novasDimensoes[index];
      if (!dimensao) return prev;

      const valor =
        valorString.trim() === "" ? undefined : Number.parseFloat(valorString);

      // Garante que é um número e não NaN, senão retorna undefined (para limpar o campo)
      const valorNumerico =
        valor !== undefined && !Number.isNaN(valor) ? valor : undefined;

      if (tipo === "valorPadrao") {
        dimensao.valorPadrao = valorNumerico;
      } else {
        // Tolerância é sempre positiva ou undefined
        dimensao.tolerancia =
          valorNumerico !== undefined ? Math.abs(valorNumerico) : undefined;
      }

      return { ...prev, dimensoes: novasDimensoes };
    });
  };

  const handleSalvarTipo = useCallback(async () => {
    if (!isFormValid || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      // 1. Prepara o payload no formato esperado pela API (TipoPecaFormPayload)
      const dimensoesArray: DimensaoRequest[] = formData.dimensoes.map((d) => ({
        nome: d.nome,
        label: d.label,
        tipo: d.tipo as "number" | "text",
        unidade: d.unidade || undefined,
        tolerancia: d.tolerancia,
        valorPadrao: d.valorPadrao,
      })) as DimensaoRequest[];

      const payload: TipoPecaFormPayload = {
        nome: formData.nome,
        descricao: formData.descricao,
        dimensoes: dimensoesArray,
      };

      // 2. Lógica Condicional para Edição ou Criação
      if (isEdicao && tipoPecaIdParaEdicao) {
        // Se estiver em modo de EDIÇÃO
        await atualizarTipoPeca(tipoPecaIdParaEdicao, payload);
        toast({
          title: "Tipo de Peça Atualizado",
          description: `O tipo de peça "${formData.nome}" foi atualizado com sucesso.`,
          variant: "default",
        });
      } else {
        // Se estiver em modo de CRIAÇÃO
        await cadastrarTipoPeca(payload);
        toast({
          title: "Novo Tipo de Peça Criado",
          description: `O tipo de peça "${formData.nome}" foi criado e está pronto para uso.`,
          variant: "default",
        });
      }

      setOpen(false);
      onSalvoComSucesso();
    } catch (err: any) {
      console.error("Erro ao salvar o Tipo de Peça:", err);
      const mensagemErro =
        err?.response?.data?.message ||
        err.message ||
        "Ocorreu um erro desconhecido ao salvar.";
      setError(mensagemErro);
      toast({
        title: "Erro ao Salvar",
        description: mensagemErro,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    isFormValid,
    isSaving,
    formData,
    cadastrarTipoPeca,
    atualizarTipoPeca, // Adicionado como dependência
    isEdicao, // Adicionado como dependência
    tipoPecaIdParaEdicao, // Adicionado como dependência
    setOpen,
    onSalvoComSucesso,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdicao ? "Editar Tipo de Peça" : "Novo Tipo de Peça"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao
              ? `Editando as configurações de "${formData.nome}"`
              : "Configure um novo tipo de peça para o sistema"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 text-sm text-red-600 border border-red-300 bg-red-50 rounded-md">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>Erro: {error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Tipo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Parafuso M10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Parafuso métrico 10mm"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Dimensões de Controle</h3>
              <Badge variant="outline">
                {formData.dimensoes.length} dimensões
              </Badge>
            </div>
            {formData.dimensoes.length > 0 && (
              <ScrollArea className="h-[200px] w-full p-2 border rounded-lg">
                <div className="space-y-2">
                  {formData.dimensoes.map((dimensao, index) => (
                    <Card key={dimensao.nome} className="p-3">
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {dimensao.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dimensao.nome} • {dimensao.tipo} • Obrigatório
                            {dimensao.unidade && ` • ${dimensao.unidade}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerCampo(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      {dimensao.tipo === "number" && (
                        <div className="mt-2 pt-2 border-t flex gap-4">
                          <div className="space-y-1 w-1/2">
                            <Label className="text-xs">
                              Valor Padrão ({dimensao.unidade})
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              value={dimensao.valorPadrao ?? ""}
                              onChange={(e) =>
                                handleUpdateEspecificacao(
                                  index,
                                  "valorPadrao",
                                  e.target.value
                                )
                              }
                              placeholder="Valor Alvo"
                            />
                          </div>
                          <div className="space-y-1 w-1/2">
                            <Label className="text-xs">
                              Tolerância Absoluta ($\pm$)
                            </Label>
                            <Input
                              type="number"
                              step="any"
                              value={dimensao.tolerancia ?? ""}
                              onChange={(e) =>
                                handleUpdateEspecificacao(
                                  index,
                                  "tolerancia",
                                  e.target.value
                                )
                              }
                              placeholder="Tolerância (+/-)"
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar Dimensão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Nome (chave) *</Label>
                    <Input
                      value={novoCampo.nome}
                      onChange={(e) =>
                        setNovoCampo((prev) => ({
                          ...prev,
                          nome: e.target.value,
                        }))
                      }
                      placeholder="comprimento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rótulo (Exibição) *</Label>
                    <Input
                      value={novoCampo.label}
                      onChange={(e) =>
                        setNovoCampo((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                      placeholder="Comprimento Total (mm)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={novoCampo.tipo}
                      onValueChange={(value: TipoCampo) =>
                        setNovoCampo((prev) => ({ ...prev, tipo: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Número (Medição)</SelectItem>
                        <SelectItem value="text">Texto (Observação)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Input
                      value={novoCampo.unidade || ""}
                      onChange={(e) =>
                        setNovoCampo((prev) => ({
                          ...prev,
                          unidade: e.target.value,
                        }))
                      }
                      placeholder="mm"
                    />
                  </div>
                </div>
                {novoCampo.tipo === "number" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                    <div className="space-y-2">
                      <Label>Valor Padrão (Nominal)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={novoCampo.valorPadrao ?? ""}
                        onChange={(e) =>
                          setNovoCampo((prev) => ({
                            ...prev,
                            valorPadrao:
                              e.target.value.trim() === ""
                                ? undefined
                                : Number.parseFloat(e.target.value),
                          }))
                        }
                        placeholder="60.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tolerância ($\pm$)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={novoCampo.tolerancia ?? ""}
                        onChange={(e) =>
                          setNovoCampo((prev) => ({
                            ...prev,
                            tolerancia:
                              e.target.value.trim() === ""
                                ? undefined
                                : Number.parseFloat(e.target.value),
                          }))
                        }
                        placeholder="0.1"
                      />
                    </div>
                  </div>
                )}
                <Button
                  onClick={adicionarCampo}
                  disabled={!novoCampo.nome.trim() || !novoCampo.label.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Dimensão
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-transparent"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarTipo}
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEdicao ? "Salvar Alterações" : "Criar Tipo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
