"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Contract } from "@/lib/types"

interface ContractFormProps {
  contract?: Contract
  isEdit?: boolean
}

export function ContractForm({ contract, isEdit = false }: ContractFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      numero_contrato: formData.get("numero_contrato") as string,
      numero_processo: formData.get("numero_processo") as string,
      numero_gms: (formData.get("numero_gms") as string) || null,
      objeto: formData.get("objeto") as string,
      contratado: formData.get("contratado") as string,
      cnpj_cpf: formData.get("cnpj_cpf") as string,
      valor_inicial: Number.parseFloat(formData.get("valor_inicial") as string),
      valor_atual: Number.parseFloat(formData.get("valor_atual") as string),
      data_assinatura: formData.get("data_assinatura") as string,
      data_inicio_vigencia: formData.get("data_inicio_vigencia") as string,
      data_fim_vigencia: formData.get("data_fim_vigencia") as string,
      prazo_meses: Number.parseInt(formData.get("prazo_meses") as string),
      prorrogavel: formData.get("prorrogavel") === "on",
      situacao: formData.get("situacao") as string,
      gestor_nome: formData.get("gestor_nome") as string,
      gestor_email: formData.get("gestor_email") as string,
      gestor_telefone: formData.get("gestor_telefone") as string,
      fiscal_nome: formData.get("fiscal_nome") as string,
      fiscal_email: formData.get("fiscal_email") as string,
      fiscal_telefone: formData.get("fiscal_telefone") as string,
      observacoes: formData.get("observacoes") as string,
    }

    try {
      const url = isEdit ? `/api/contratos/${contract?.id}` : "/api/contratos"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar contrato")
      }

      router.push("/admin/contratos")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar contrato")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="numero_contrato">Número do Contrato *</Label>
              <Input id="numero_contrato" name="numero_contrato" defaultValue={contract?.numero_contrato} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_processo">Número do Processo *</Label>
              <Input id="numero_processo" name="numero_processo" defaultValue={contract?.numero_processo} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_gms">Número GMS</Label>
              <Input id="numero_gms" name="numero_gms" defaultValue={contract?.numero_gms ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objeto">Objeto do Contrato *</Label>
            <Textarea id="objeto" name="objeto" defaultValue={contract?.objeto} rows={3} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contratado">Contratado *</Label>
              <Input id="contratado" name="contratado" defaultValue={contract?.contratado} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj_cpf">CNPJ/CPF *</Label>
              <Input id="cnpj_cpf" name="cnpj_cpf" defaultValue={contract?.cnpj_cpf} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Valores e Prazos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valor_inicial">Valor Inicial (R$) *</Label>
              <Input
                id="valor_inicial"
                name="valor_inicial"
                type="number"
                step="0.01"
                defaultValue={contract?.valor_inicial}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_atual">Valor Atual (R$) *</Label>
              <Input
                id="valor_atual"
                name="valor_atual"
                type="number"
                step="0.01"
                defaultValue={contract?.valor_atual}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="data_assinatura">Data de Assinatura *</Label>
              <Input
                id="data_assinatura"
                name="data_assinatura"
                type="date"
                defaultValue={contract?.data_assinatura}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_inicio_vigencia">Início da Vigência *</Label>
              <Input
                id="data_inicio_vigencia"
                name="data_inicio_vigencia"
                type="date"
                defaultValue={contract?.data_inicio_vigencia}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim_vigencia">Fim da Vigência *</Label>
              <Input
                id="data_fim_vigencia"
                name="data_fim_vigencia"
                type="date"
                defaultValue={contract?.data_fim_vigencia}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prazo_meses">Prazo (meses) *</Label>
              <Input id="prazo_meses" name="prazo_meses" type="number" defaultValue={contract?.prazo_meses} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="situacao">Situação *</Label>
              <Select name="situacao" defaultValue={contract?.situacao || "vigente"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vigente">Vigente</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="rescindido">Rescindido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="prorrogavel" name="prorrogavel" defaultChecked={contract?.prorrogavel} />
            <Label htmlFor="prorrogavel" className="cursor-pointer">
              Contrato prorrogável
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gestor e Fiscal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gestor_nome">Nome do Gestor *</Label>
            <Input id="gestor_nome" name="gestor_nome" defaultValue={contract?.gestor_nome} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gestor_email">E-mail do Gestor</Label>
              <Input id="gestor_email" name="gestor_email" type="email" defaultValue={contract?.gestor_email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gestor_telefone">Telefone do Gestor</Label>
              <Input id="gestor_telefone" name="gestor_telefone" defaultValue={contract?.gestor_telefone} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fiscal_nome">Nome do Fiscal *</Label>
            <Input id="fiscal_nome" name="fiscal_nome" defaultValue={contract?.fiscal_nome} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fiscal_email">E-mail do Fiscal</Label>
              <Input id="fiscal_email" name="fiscal_email" type="email" defaultValue={contract?.fiscal_email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal_telefone">Telefone do Fiscal</Label>
              <Input id="fiscal_telefone" name="fiscal_telefone" defaultValue={contract?.fiscal_telefone} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="observacoes"
            name="observacoes"
            defaultValue={contract?.observacoes}
            rows={4}
            placeholder="Informações adicionais sobre o contrato..."
          />
        </CardContent>
      </Card>

      {error && <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : isEdit ? "Atualizar Contrato" : "Cadastrar Contrato"}
        </Button>
      </div>
    </form>
  )
}
