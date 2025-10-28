"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Upload, Download, Trash2, File } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ContractFile } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ContractFilesProps {
  contractId: string
  files: ContractFile[]
}

export function ContractFiles({ contractId, files }: ContractFilesProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch(`/api/contratos/${contractId}/files`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao fazer upload")
      }

      router.refresh()
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Erro ao fazer upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("Tem certeza que deseja excluir este arquivo?")) return

    try {
      const response = await fetch(`/api/contratos/${contractId}/files/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir arquivo")
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir arquivo")
    }
  }

  const handleDownload = async (file: ContractFile) => {
    try {
      const response = await fetch(`/api/contratos/${contractId}/files/${file.id}/download`)

      if (!response.ok) {
        throw new Error("Erro ao baixar arquivo")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.nome_arquivo
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao baixar arquivo")
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      contrato: "Contrato",
      extrato: "Extrato",
      aditivo: "Aditivo",
      apostilamento: "Apostilamento",
      portaria: "Portaria",
      outro: "Outro",
    }
    return labels[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      contrato: "bg-blue-100 text-blue-800 border-blue-200",
      extrato: "bg-green-100 text-green-800 border-green-200",
      aditivo: "bg-purple-100 text-purple-800 border-purple-200",
      apostilamento: "bg-amber-100 text-amber-800 border-amber-200",
      portaria: "bg-pink-100 text-pink-800 border-pink-200",
      outro: "bg-slate-100 text-slate-800 border-slate-200",
    }
    return colors[tipo] || colors.outro
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivos do Contrato</CardTitle>
        <CardDescription>Gerencie os documentos relacionados a este contrato</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="space-y-4 rounded-lg border bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Upload de Arquivo</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo (PDF) *</Label>
              <Input id="file" name="file" type="file" accept=".pdf" required disabled={isUploading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento *</Label>
              <Select name="tipo" required disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="extrato">Extrato</SelectItem>
                  <SelectItem value="aditivo">Aditivo</SelectItem>
                  <SelectItem value="apostilamento">Apostilamento</SelectItem>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {uploadError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{uploadError}</div>}
          <Button type="submit" disabled={isUploading} className="gap-2">
            <Upload className="h-4 w-4" />
            {isUploading ? "Enviando..." : "Enviar Arquivo"}
          </Button>
        </form>

        {/* Files List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Arquivos ({files.length})</h3>
          {files.length > 0 ? (
            files.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <File className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{file.nome_arquivo}</p>
                      <Badge className={getTipoColor(file.tipo)}>{getTipoLabel(file.tipo)}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {formatFileSize(file.tamanho_bytes)} •{" "}
                      {new Date(file.uploaded_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(file)} className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(file.id)} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 py-12">
              <FileText className="mb-3 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-600">Nenhum arquivo enviado ainda</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
