"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"

export function ImportForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsLoading(true)
    setResult(null)

    try {
      const text = await file.text()
      const response = await fetch("/api/contratos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao importar contratos")
      }

      setResult(data)

      if (data.success > 0) {
        setTimeout(() => {
          router.push("/admin/contratos")
          router.refresh()
        }, 2000)
      }
    } catch (error) {
      setResult({
        success: 0,
        errors: [error instanceof Error ? error.message : "Erro ao importar contratos"],
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formato do Arquivo CSV</CardTitle>
          <CardDescription>O arquivo deve conter as seguintes colunas (separadas por vírgula):</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-slate-100 p-4">
            <code className="text-xs text-slate-900">
              numero_contrato,numero_processo,objeto,contratado,cnpj_cpf,valor_inicial,valor_atual,
              data_assinatura,data_inicio_vigencia,data_fim_vigencia,prazo_meses,prorrogavel,
              situacao,gestor_nome,gestor_email,gestor_telefone,fiscal_nome,fiscal_email,fiscal_telefone
            </code>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            <strong>Notas importantes:</strong>
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
            <li>As datas devem estar no formato AAAA-MM-DD (ex: 2025-01-15)</li>
            <li>Os valores devem usar ponto como separador decimal (ex: 1000.50)</li>
            <li>O campo prorrogavel deve ser "true" ou "false"</li>
            <li>O campo situacao deve ser: vigente, encerrado, suspenso ou rescindido</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload do Arquivo</CardTitle>
          <CardDescription>Selecione o arquivo CSV para importar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo CSV</Label>
              <div className="flex items-center gap-4">
                <Input id="file" type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={!file || isLoading} className="gap-2">
              <Upload className="h-4 w-4" />
              {isLoading ? "Importando..." : "Importar Contratos"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.errors.length > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {result.errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">
                  {result.success > 0
                    ? `${result.success} contrato(s) importado(s) com sucesso!`
                    : "Nenhum contrato foi importado"}
                </h3>
                {result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-900">Erros encontrados:</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.success > 0 && (
                  <p className="mt-2 text-sm text-slate-600">Redirecionando para a lista de contratos...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
