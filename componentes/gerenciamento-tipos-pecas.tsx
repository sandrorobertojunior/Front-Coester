"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Save, X, Settings, Ruler, AlertTriangle, CheckCircle, Copy, Search } from "lucide-react"
import { useAutenticacao } from "@/contextos/contexto-autenticacao"

// Interface para definir um campo de medição
interface CampoMedicao {
  nome: string
  label: string
  tipo: "number" | "text"
  obrigatorio: boolean
  min?: number
  max?: number
  step?: number
  unidade?: string
}

// Interface para especificações técnicas
interface Especificacao {
  min: number
  max: number
  tolerancia: number
}

// Interface para um tipo de peça
interface TipoPeca {
  id: string
  nome: string
  descricao: string
  campos: CampoMedicao[]
  especificacoes: Record<string, Especificacao>
  ativo: boolean
  criadoEm: string
  criadoPor: string
  totalMedicoes?: number
}

// Dados iniciais dos tipos de peças (simulando dados do backend)
const tiposPecasIniciais: TipoPeca[] = [
  {
    id: "eixo-transmissao",
    nome: "Eixo de Transmissão",
    descricao: "Eixo principal para transmissão de movimento rotativo",
    campos: [
      { nome: "comprimento", label: "Comprimento", tipo: "number", obrigatorio: true, min: 0, max: 500, unidade: "mm" },
      { nome: "diametro", label: "Diâmetro", tipo: "number", obrigatorio: true, min: 0, max: 100, unidade: "mm" },
      {
        nome: "tolerancia",
        label: "Tolerância",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 1,
        step: 0.01,
        unidade: "±mm",
      },
    ],
    especificacoes: {
      comprimento: { min: 140, max: 160, tolerancia: 0.1 },
      diametro: { min: 24, max: 26, tolerancia: 0.1 },
    },
    ativo: true,
    criadoEm: "2024-01-01",
    criadoPor: "Sistema",
    totalMedicoes: 312,
  },
  {
    id: "engrenagem",
    nome: "Engrenagem",
    descricao: "Engrenagem cilíndrica de dentes retos",
    campos: [
      { nome: "diametro", label: "Diâmetro", tipo: "number", obrigatorio: true, min: 0, max: 200, unidade: "mm" },
      { nome: "espessura", label: "Espessura", tipo: "number", obrigatorio: true, min: 0, max: 50, unidade: "mm" },
      {
        nome: "numeroDentes",
        label: "Número de Dentes",
        tipo: "number",
        obrigatorio: true,
        min: 1,
        max: 200,
        unidade: "un",
      },
      {
        nome: "tolerancia",
        label: "Tolerância",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 1,
        step: 0.01,
        unidade: "±mm",
      },
    ],
    especificacoes: {
      diametro: { min: 75, max: 85, tolerancia: 0.05 },
      espessura: { min: 10, max: 14, tolerancia: 0.05 },
    },
    ativo: true,
    criadoEm: "2024-01-01",
    criadoPor: "Sistema",
    totalMedicoes: 287,
  },
  {
    id: "parafuso-m8",
    nome: "Parafuso M8",
    descricao: "Parafuso métrico M8 com rosca padrão",
    campos: [
      { nome: "comprimento", label: "Comprimento", tipo: "number", obrigatorio: true, min: 0, max: 100, unidade: "mm" },
      { nome: "diametro", label: "Diâmetro", tipo: "number", obrigatorio: true, min: 0, max: 20, unidade: "mm" },
      {
        nome: "passo",
        label: "Passo da Rosca",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 5,
        step: 0.1,
        unidade: "mm",
      },
      {
        nome: "tolerancia",
        label: "Tolerância",
        tipo: "number",
        obrigatorio: true,
        min: 0,
        max: 1,
        step: 0.01,
        unidade: "±mm",
      },
    ],
    especificacoes: {
      comprimento: { min: 38, max: 42, tolerancia: 0.02 },
      diametro: { min: 7.8, max: 8.2, tolerancia: 0.02 },
    },
    ativo: true,
    criadoEm: "2024-01-01",
    criadoPor: "Sistema",
    totalMedicoes: 234,
  },
]

export function GerenciamentoTiposPecas() {
  const { usuario } = useAutenticacao()
  const [tiposPecas, setTiposPecas] = useState<TipoPeca[]>(tiposPecasIniciais)
  const [termoBusca, setTermoBusca] = useState("")
  const [dialogAberto, setDialogAberto] = useState(false)
  const [tipoEditando, setTipoEditando] = useState<TipoPeca | null>(null)
  const [abaAtiva, setAbaAtiva] = useState("lista")

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    campos: [] as CampoMedicao[],
    especificacoes: {} as Record<string, Especificacao>,
  })

  // Estado para novo campo
  const [novoCampo, setNovoCampo] = useState<CampoMedicao>({
    nome: "",
    label: "",
    tipo: "number",
    obrigatorio: true,
    unidade: "mm",
  })

  // Filtra tipos de peças
  const tiposFiltrados = tiposPecas.filter(
    (tipo) =>
      tipo.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      tipo.descricao.toLowerCase().includes(termoBusca.toLowerCase()),
  )

  // Abre dialog para novo tipo
  const abrirNovoTipo = () => {
    setTipoEditando(null)
    setFormData({
      nome: "",
      descricao: "",
      campos: [],
      especificacoes: {},
    })
    setDialogAberto(true)
  }

  // Abre dialog para editar tipo
  const abrirEdicaoTipo = (tipo: TipoPeca) => {
    setTipoEditando(tipo)
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao,
      campos: [...tipo.campos],
      especificacoes: { ...tipo.especificacoes },
    })
    setDialogAberto(true)
  }

  // Adiciona novo campo ao formulário
  const adicionarCampo = () => {
    if (!novoCampo.nome || !novoCampo.label) return

    const campoFormatado: CampoMedicao = {
      ...novoCampo,
      nome: novoCampo.nome.toLowerCase().replace(/\s+/g, ""),
    }

    setFormData((prev) => ({
      ...prev,
      campos: [...prev.campos, campoFormatado],
    }))

    setNovoCampo({
      nome: "",
      label: "",
      tipo: "number",
      obrigatorio: true,
      unidade: "mm",
    })
  }

  // Remove campo do formulário
  const removerCampo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      campos: prev.campos.filter((_, i) => i !== index),
    }))
  }

  // Adiciona especificação para um campo
  const adicionarEspecificacao = (nomeCampo: string, spec: Especificacao) => {
    setFormData((prev) => ({
      ...prev,
      especificacoes: {
        ...prev.especificacoes,
        [nomeCampo]: spec,
      },
    }))
  }

  // Salva tipo de peça (novo ou editado)
  const salvarTipo = () => {
    if (!formData.nome || formData.campos.length === 0) return

    const novoTipo: TipoPeca = {
      id: tipoEditando?.id || formData.nome.toLowerCase().replace(/\s+/g, "-"),
      nome: formData.nome,
      descricao: formData.descricao,
      campos: formData.campos,
      especificacoes: formData.especificacoes,
      ativo: true,
      criadoEm: tipoEditando?.criadoEm || new Date().toISOString().split("T")[0],
      criadoPor: tipoEditando?.criadoPor || usuario?.nome || "Admin",
      totalMedicoes: tipoEditando?.totalMedicoes || 0,
    }

    if (tipoEditando) {
      setTiposPecas((prev) => prev.map((tipo) => (tipo.id === tipoEditando.id ? novoTipo : tipo)))
    } else {
      setTiposPecas((prev) => [...prev, novoTipo])
    }

    setDialogAberto(false)
  }

  // Duplica tipo de peça
  const duplicarTipo = (tipo: TipoPeca) => {
    const tipoDuplicado: TipoPeca = {
      ...tipo,
      id: `${tipo.id}-copia-${Date.now()}`,
      nome: `${tipo.nome} (Cópia)`,
      criadoEm: new Date().toISOString().split("T")[0],
      criadoPor: usuario?.nome || "Admin",
      totalMedicoes: 0,
    }

    setTiposPecas((prev) => [...prev, tipoDuplicado])
  }

  // Alterna status ativo/inativo
  const alternarStatus = (id: string) => {
    setTiposPecas((prev) => prev.map((tipo) => (tipo.id === id ? { ...tipo, ativo: !tipo.ativo } : tipo)))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Tipos de Peças</h1>
          <p className="text-muted-foreground">Configure e gerencie os tipos de peças do sistema</p>
        </div>
        <Button onClick={abrirNovoTipo} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo de Peça
        </Button>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList>
          <TabsTrigger value="lista">Lista de Tipos</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba: Lista de Tipos */}
        <TabsContent value="lista" className="space-y-6">
          {/* Busca */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tipos de peças..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Tipos */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Peças Cadastrados</CardTitle>
              <CardDescription>{tiposFiltrados.length} tipos encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Campos</TableHead>
                    <TableHead>Medições</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposFiltrados.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-medium">{tipo.nome}</TableCell>
                      <TableCell className="max-w-48 truncate">{tipo.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tipo.campos.length} campos</Badge>
                      </TableCell>
                      <TableCell>{tipo.totalMedicoes || 0}</TableCell>
                      <TableCell>
                        <Badge variant={tipo.ativo ? "default" : "secondary"}>{tipo.ativo ? "Ativo" : "Inativo"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tipo.criadoEm}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => abrirEdicaoTipo(tipo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => duplicarTipo(tipo)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => alternarStatus(tipo.id)}
                            className={tipo.ativo ? "text-red-600" : "text-green-600"}
                          >
                            {tipo.ativo ? <X className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tipos</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tiposPecas.length}</div>
                <p className="text-xs text-muted-foreground">{tiposPecas.filter((t) => t.ativo).length} ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mais Utilizado</CardTitle>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {tiposPecas.sort((a, b) => (b.totalMedicoes || 0) - (a.totalMedicoes || 0))[0]?.nome}
                </div>
                <p className="text-xs text-muted-foreground">
                  {tiposPecas.sort((a, b) => (b.totalMedicoes || 0) - (a.totalMedicoes || 0))[0]?.totalMedicoes}{" "}
                  medições
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campos Médios</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(tiposPecas.reduce((acc, tipo) => acc + tipo.campos.length, 0) / tiposPecas.length)}
                </div>
                <p className="text-xs text-muted-foreground">por tipo de peça</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Medições</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tiposPecas.reduce((acc, tipo) => acc + (tipo.totalMedicoes || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">em todos os tipos</p>
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Tipos */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking por Utilização</CardTitle>
              <CardDescription>Tipos de peças ordenados por número de medições</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tiposPecas
                  .sort((a, b) => (b.totalMedicoes || 0) - (a.totalMedicoes || 0))
                  .map((tipo, index) => (
                    <div key={tipo.id} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{tipo.nome}</p>
                        <p className="text-sm text-muted-foreground">{tipo.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tipo.totalMedicoes || 0}</p>
                        <p className="text-xs text-muted-foreground">medições</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Criar/Editar Tipo */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tipoEditando ? "Editar Tipo de Peça" : "Novo Tipo de Peça"}</DialogTitle>
            <DialogDescription>
              {tipoEditando
                ? "Modifique as informações do tipo de peça"
                : "Configure um novo tipo de peça para o sistema"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Tipo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Eixo de Transmissão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do tipo de peça"
                />
              </div>
            </div>

            {/* Campos de Medição */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Campos de Medição</h3>
                <Badge variant="outline">{formData.campos.length} campos</Badge>
              </div>

              {/* Lista de Campos Existentes */}
              {formData.campos.length > 0 && (
                <div className="space-y-2">
                  {formData.campos.map((campo, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{campo.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {campo.nome} • {campo.tipo} • {campo.obrigatorio ? "Obrigatório" : "Opcional"}
                          {campo.unidade && ` • ${campo.unidade}`}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removerCampo(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para Novo Campo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Adicionar Campo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Campo</Label>
                      <Input
                        value={novoCampo.nome}
                        onChange={(e) => setNovoCampo((prev) => ({ ...prev, nome: e.target.value }))}
                        placeholder="comprimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rótulo</Label>
                      <Input
                        value={novoCampo.label}
                        onChange={(e) => setNovoCampo((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="Comprimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={novoCampo.tipo}
                        onValueChange={(value: "number" | "text") => setNovoCampo((prev) => ({ ...prev, tipo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                        onChange={(e) => setNovoCampo((prev) => ({ ...prev, unidade: e.target.value }))}
                        placeholder="mm"
                      />
                    </div>
                  </div>

                  {novoCampo.tipo === "number" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Valor Mínimo</Label>
                        <Input
                          type="number"
                          value={novoCampo.min || ""}
                          onChange={(e) =>
                            setNovoCampo((prev) => ({ ...prev, min: Number.parseFloat(e.target.value) || undefined }))
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Máximo</Label>
                        <Input
                          type="number"
                          value={novoCampo.max || ""}
                          onChange={(e) =>
                            setNovoCampo((prev) => ({ ...prev, max: Number.parseFloat(e.target.value) || undefined }))
                          }
                          placeholder="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Incremento</Label>
                        <Input
                          type="number"
                          value={novoCampo.step || ""}
                          onChange={(e) =>
                            setNovoCampo((prev) => ({ ...prev, step: Number.parseFloat(e.target.value) || undefined }))
                          }
                          placeholder="0.01"
                        />
                      </div>
                    </div>
                  )}

                  <Button onClick={adicionarCampo} disabled={!novoCampo.nome || !novoCampo.label}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogAberto(false)} className="bg-transparent">
                Cancelar
              </Button>
              <Button onClick={salvarTipo} disabled={!formData.nome || formData.campos.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                {tipoEditando ? "Salvar Alterações" : "Criar Tipo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
