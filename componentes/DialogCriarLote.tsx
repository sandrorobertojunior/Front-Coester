"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/components/ui/use-toast";

// [MUDANÇA] Importando o tipo original
import {
  CriarLoteRequest as CriarLoteRequestOriginal,
  TipoPecaResponse,
} from "../contextos/api/controlequalidade"; // Ajuste o caminho

// [MUDANÇA] Criando um tipo local que omite o 'codigoLote', pois ele não é preenchido pelo usuário
type CriarLoteForm = Omit<CriarLoteRequestOriginal, "codigoLote">;

interface DialogCriarLoteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  dadosIniciais: Partial<CriarLoteForm>;
  tiposPecas: TipoPecaResponse[];
  onCriarLote: (lote: CriarLoteForm) => Promise<void>;
}

const ESTADO_INICIAL_LOTE: CriarLoteForm = {
  descricao: "",
  tipoPecaId: 0,
  quantidadePecas: 100,
  quantidadeAmostrasDesejada: 10,
  observacoes: "",
};

export function DialogCriarLote({
  open,
  setOpen,
  dadosIniciais,
  tiposPecas,
  onCriarLote,
}: DialogCriarLoteProps) {
  const [formDataLote, setFormDataLote] =
    useState<CriarLoteForm>(ESTADO_INICIAL_LOTE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormDataLote({
        descricao: dadosIniciais.descricao || "",
        tipoPecaId: dadosIniciais.tipoPecaId || 0,
        quantidadePecas: dadosIniciais.quantidadePecas || 100,
        quantidadeAmostrasDesejada:
          dadosIniciais.quantidadeAmostrasDesejada || 10,
        observacoes: dadosIniciais.observacoes || "",
      });
    }
  }, [open, dadosIniciais]);

  const isFormValid =
    formDataLote.descricao.trim() !== "" &&
    formDataLote.tipoPecaId > 0 &&
    formDataLote.quantidadePecas > 0 &&
    (formDataLote.quantidadeAmostrasDesejada ?? 0) > 0 &&
    (formDataLote.quantidadeAmostrasDesejada ?? 0) <=
      formDataLote.quantidadePecas;

  const handleCriarLote = async () => {
    if (!isFormValid) {
      toast({
        title: "Formulário Inválido",
        description:
          "Preencha todos os campos obrigatórios (*) e verifique se as quantidades são válidas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCriarLote(formDataLote);
      setOpen(false);
    } catch (e) {
      console.error("Erro capturado no Dialog:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    campo: keyof CriarLoteForm,
    valor: string | number
  ) => {
    setFormDataLote((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Lote de Produção</DialogTitle>
          <DialogDescription>
            Defina as especificações do lote para iniciar o controle de
            qualidade. O código do lote será gerado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* CAMPO 'codigoLote' REMOVIDO DAQUI */}
          <div className="space-y-2">
            <Label htmlFor="descricaoLote">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descricao"
              value={formDataLote.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Ex: Lote de parafusos sextavados para Cliente Y"
            />
          </div>
          <div className="space-y-2">
            <Label>
              Tipo de Peça <span className="text-red-500">*</span>
            </Label>
            <Select
              value={String(formDataLote.tipoPecaId || "")}
              onValueChange={(value) =>
                handleInputChange("tipoPecaId", Number(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Tipo de Peça" />
              </SelectTrigger>
              <SelectContent>
                {tiposPecas.map((tipo) => (
                  <SelectItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadePecas">
                Qtd. de Peças no Lote <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantidadePecas"
                type="number"
                value={formDataLote.quantidadePecas}
                onChange={(e) =>
                  handleInputChange("quantidadePecas", Number(e.target.value))
                }
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidadeAmostrasDesejada">
                Qtd. de Amostras a Medir <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantidadeAmostrasDesejada"
                type="number"
                value={formDataLote.quantidadeAmostrasDesejada}
                onChange={(e) =>
                  handleInputChange(
                    "quantidadeAmostrasDesejada",
                    Number(e.target.value)
                  )
                }
                min={1}
                max={formDataLote.quantidadePecas}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCriarLote}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            Criar Lote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DialogCriarLote;
