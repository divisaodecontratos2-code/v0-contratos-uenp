"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ContractExtension } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ContractExtensionsProps {
  contractId: string
  extensions: ContractExtension[]
}

export function ContractExtensions({ contractId, extensions }: ContractExtensionsProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      data_solicitacao: formData.get("data_solicitacao") as string,
      prazo_meses: Number.parseInt(formData.get("prazo_meses") as string),
      nova_data_fim: formData.get("nova_data_fim") as string,
      justificativa: formData.get("justificativa") as string,
      status: "pendente",
    }

    try {
      const response = await fetch(`/api/contratos/${contractId}/extensions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao adicionar prorrogação")
      }

      router.refresh()
      setIsAdding(false)
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar prorrogação")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-amber-100 text-amber-800 border-amber-200",
      aprovada: "bg-green-100 text-green-800 border-green-200",
      rejeitada: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[status] || "bg-slate-100 text-slate-800 border-slate-200"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: "Pendente",
      aprovada: "Aprovada",
      rejeitada: "Rejeitada",
    }
    return labels[status] || status
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prorrogações</CardTitle>
            <CardDescription>Gerencie as solicitações de prorrogação do contrato</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Solicitar Prorrogação
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Nova Solicitação de Prorrogação</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setError(null)
                }}
              >
                Cancelar
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_solicitacao">Data da Solicitação *</Label>
                <Input id="data_solicitacao" name="data_solicitacao" type="date" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazo_meses">Prazo Adicional (meses) *</Label>
                <Input id="prazo_meses" name="prazo_meses" type="number" required disabled={isSubmitting} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nova_data_fim">Nova Data de Fim *</Label>
              <Input id="nova_data_fim" name="nova_data_fim" type="date" required disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa *</Label>
              <Textarea
                id="justificativa"
                name="justificativa"
                required
                disabled={isSubmitting}
                rows={3}
                placeholder="Justifique a necessidade de prorrogação..."
              />
            </div>

            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Solicitação"}
            </Button>
          </form>
        )}

        {/* Extensions List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Histórico ({extensions.length})</h3>
          {extensions.length > 0 ? (
            extensions.map((extension) => (
              <div key={extension.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-600" />
                      <span className="font-semibold text-slate-900">Prorrogação de {extension.prazo_meses} meses</span>
                      <Badge className={getStatusColor(extension.status)}>{getStatusLabel(extension.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-900">{extension.justificativa}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <div>
                        <span className="font-medium">Data da Solicitação:</span>{" "}
                        {new Date(extension.data_solicitacao).toLocaleDateString("pt-BR")}
                      </div>
                      <div>
                        <span className="font-medium">Nova Data de Fim:</span>{" "}
                        {new Date(extension.nova_data_fim).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 py-12">
              <Clock className="mb-3 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-600">Nenhuma prorrogação solicitada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
