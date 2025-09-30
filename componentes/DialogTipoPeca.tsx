"use client";

import React, { useState, useCallback } from "react";
import { Plus, Save, Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  useControleQualidadeApi,
  CriarTipoPecaRequest,
  CotaMetadata,
} from "@/contextos/api/controlequalidade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface DialogTipoPecaProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: CriarTipoPecaRequest;
  setFormData: React.Dispatch<React.SetStateAction<CriarTipoPecaRequest>>;
  novoCampo: CotaMetadata;
  setNovoCampo: React.Dispatch<React.SetStateAction<CotaMetadata>>;
  adicionarCampo: () => void;
  removerCampo: (index: number) => void;
  onSalvoComSucesso: () => void;
  tipoPecaIdParaEdicao?: number | string | null;
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
  tipoPecaIdParaEdicao,
}: DialogTipoPecaProps) {
  const { cadastrarTipoPeca, atualizarTipoPeca } = useControleQualidadeApi();
  const [isSaving, setIsSaving] = useState(false);
  const isEdicao = !!tipoPecaIdParaEdicao;
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
      const valorNumerico =
        valor !== undefined && !Number.isNaN(valor) ? valor : undefined;

      if (tipo === "valorPadrao") {
        dimensao.valorPadrao = valorNumerico;
      } else {
        dimensao.tolerancia =
          valorNumerico !== undefined ? Math.abs(valorNumerico) : undefined;
      }

      return { ...prev, dimensoes: novasDimensoes };
    });
  };

  const handleSalvarTipo = useCallback(async () => {
    if (!isFormValid || isSaving) return;

    setIsSaving(true);
    try {
      const payload: CriarTipoPecaRequest = formData;

      if (isEdicao && tipoPecaIdParaEdicao) {
        await atualizarTipoPeca(tipoPecaIdParaEdicao, payload);
        toast({
          title: "Tipo de Peça Atualizado",
          description: `"${formData.nome}" foi atualizado com sucesso.`,
        });
      } else {
        await cadastrarTipoPeca(payload);
        toast({
          title: "Novo Tipo de Peça Criado",
          description: `"${formData.nome}" foi criado e está pronto para uso.`,
        });
      }
      onSalvoComSucesso();
    } catch (err: any) {
      toast({
        title: "Erro ao Salvar",
        description:
          err?.response?.data?.message ||
          err.message ||
          "Ocorreu um erro desconhecido.",
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
    atualizarTipoPeca,
    isEdicao,
    tipoPecaIdParaEdicao,
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
            <h3 className="text-lg font-medium">Dimensões de Controle *</h3>
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
                            {dimensao.nome} • {dimensao.tipo}
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
                              Tolerância Absoluta (±)
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
                      placeholder="Comprimento Total"
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
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="text">Texto</SelectItem>
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
