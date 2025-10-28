"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileEdit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ContractAmendment } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ContractAmendmentsProps {
  contractId: string
  amendments: ContractAmendment[]
}

export function ContractAmendments({ contractId, amendments }: ContractAmendmentsProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTipo, setSelectedTipo] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      tipo: formData.get("tipo") as string,
      numero: formData.get("numero") as string,
      data: formData.get("data") as string,
      descricao: formData.get("descricao") as string,
      valor_alteracao: formData.get("valor_alteracao")
        ? Number.parseFloat(formData.get("valor_alteracao") as string)
        : null,
      prazo_alteracao_meses: formData.get("prazo_alteracao_meses")
        ? Number.parseInt(formData.get("prazo_alteracao_meses") as string)
        : null,
      nova_data_fim: (formData.get("nova_data_fim") as string) || null,
      justificativa: formData.get("justificativa") as string,
    }

    try {
      const response = await fetch(`/api/contratos/${contractId}/amendments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao adicionar aditivo")
      }

      router.refresh()
      setIsAdding(false)
      ;(e.target as HTMLFormElement).reset()
      setSelectedTipo("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar aditivo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      aditivo_prazo: "Aditivo de Prazo",
      aditivo_valor: "Aditivo de Valor",
      aditivo_misto: "Aditivo Misto",
      apostilamento: "Apostilamento",
    }
    return labels[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      aditivo_prazo: "bg-blue-100 text-blue-800 border-blue-200",
      aditivo_valor: "bg-green-100 text-green-800 border-green-200",
      aditivo_misto: "bg-purple-100 text-purple-800 border-purple-200",
      apostilamento: "bg-amber-100 text-amber-800 border-amber-200",
    }
    return colors[tipo] || "bg-slate-100 text-slate-800 border-slate-200"
  }

  const showValorField = selectedTipo === "aditivo_valor" || selectedTipo === "aditivo_misto"
  const showPrazoFields = selectedTipo === "aditivo_prazo" || selectedTipo === "aditivo_misto"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Aditivos e Apostilamentos</CardTitle>
            <CardDescription>Gerencie as alterações contratuais</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Novo Aditivo/Apostilamento</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setError(null)
                  setSelectedTipo("")
                }}
              >
                Cancelar
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select name="tipo" required disabled={isSubmitting} onValueChange={(value) => setSelectedTipo(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aditivo_prazo">Aditivo de Prazo</SelectItem>
                    <SelectItem value="aditivo_valor">Aditivo de Valor</SelectItem>
                    <SelectItem value="aditivo_misto">Aditivo Misto (Prazo + Valor)</SelectItem>
                    <SelectItem value="apostilamento">Apostilamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número *</Label>
                <Input id="numero" name="numero" required disabled={isSubmitting} placeholder="Ex: 001/2025" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" name="data" type="date" required disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                name="descricao"
                required
                disabled={isSubmitting}
                rows={3}
                placeholder="Descreva as alterações..."
              />
            </div>

            {showValorField && (
              <div className="space-y-2">
                <Label htmlFor="valor_alteracao">Alteração de Valor (R$) *</Label>
                <Input
                  id="valor_alteracao"
                  name="valor_alteracao"
                  type="number"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                  placeholder="Valor positivo ou negativo"
                />
                <p className="text-xs text-slate-600">Use valores negativos para reduções</p>
              </div>
            )}

            {showPrazoFields && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prazo_alteracao_meses">Alteração de Prazo (meses) *</Label>
                  <Input
                    id="prazo_alteracao_meses"
                    name="prazo_alteracao_meses"
                    type="number"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nova_data_fim">Nova Data de Fim *</Label>
                  <Input id="nova_data_fim" name="nova_data_fim" type="date" required disabled={isSubmitting} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa</Label>
              <Textarea
                id="justificativa"
                name="justificativa"
                disabled={isSubmitting}
                rows={2}
                placeholder="Justificativa para a alteração..."
              />
            </div>

            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Aditivo"}
            </Button>
          </form>
        )}

        {/* Amendments List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Histórico ({amendments.length})</h3>
          {amendments.length > 0 ? (
            amendments.map((amendment) => (
              <div key={amendment.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileEdit className="h-4 w-4 text-slate-600" />
                      <span className="font-semibold text-slate-900">{amendment.numero}</span>
                      <Badge className={getTipoColor(amendment.tipo)}>{getTipoLabel(amendment.tipo)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-900">{amendment.descricao}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <div>
                        <span className="font-medium">Data:</span>{" "}
                        {new Date(amendment.data).toLocaleDateString("pt-BR")}
                      </div>
                      {amendment.valor_alteracao && (
                        <div>
                          <span className="font-medium">Alteração de Valor:</span>{" "}
                          <span className={amendment.valor_alteracao >= 0 ? "text-green-600" : "text-red-600"}>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                              signDisplay: "always",
                            }).format(amendment.valor_alteracao)}
                          </span>
                        </div>
                      )}
                      {amendment.prazo_alteracao_meses && (
                        <div>
                          <span className="font-medium">Alteração de Prazo:</span> +{amendment.prazo_alteracao_meses}{" "}
                          meses
                        </div>
                      )}
                      {amendment.nova_data_fim && (
                        <div>
                          <span className="font-medium">Nova Data de Fim:</span>{" "}
                          {new Date(amendment.nova_data_fim).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                    {amendment.justificativa && (
                      <p className="mt-2 text-sm italic text-slate-600">{amendment.justificativa}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 py-12">
              <FileEdit className="mb-3 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-600">Nenhum aditivo ou apostilamento registrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
