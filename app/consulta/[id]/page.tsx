import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Home, Download, File } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatBrazilianDate } from "@/lib/utils"

export default async function ConsultaDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase.from("contracts").select("*").eq("id", id).single()

  if (!contract) {
    notFound()
  }

  const [{ data: files }, { data: amendments }, { data: extensions }] = await Promise.all([
    supabase.from("contract_files").select("*").eq("contract_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("contract_amendments").select("*").eq("contract_id", id).order("data", { ascending: false }),
    supabase
      .from("contract_extensions")
      .select("*")
      .eq("contract_id", id)
      .order("data_solicitacao", { ascending: false }),
  ])

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case "vigente":
        return "bg-green-100 text-green-800 border-green-200"
      case "encerrado":
        return "bg-slate-100 text-slate-800 border-slate-200"
      case "suspenso":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "rescindido":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
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
      aditivo_prazo: "Aditivo de Prazo",
      aditivo_valor: "Aditivo de Valor",
      aditivo_misto: "Aditivo Misto",
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
      aditivo_prazo: "bg-blue-100 text-blue-800 border-blue-200",
      aditivo_valor: "bg-green-100 text-green-800 border-green-200",
      aditivo_misto: "bg-purple-100 text-purple-800 border-purple-200",
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
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Sistema de Contratos UENP</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <Home className="h-4 w-4" />
                Início
              </Button>
            </Link>
            <Link href="/consulta">
              <Button variant="ghost">Consulta Pública</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/consulta" className="text-sm text-blue-600 hover:underline">
              ← Voltar para a lista
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{contract.numero_contrato}</h1>
              <Badge className={getSituacaoColor(contract.situacao)}>{contract.situacao}</Badge>
              {contract.prorrogavel && (
                <Badge variant="outline" className="border-blue-600 text-blue-600">
                  Prorrogável
                </Badge>
              )}
            </div>
            <p className="mt-2 text-slate-600">{contract.objeto}</p>
          </div>

          {/* Contract Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-600">Número do Contrato</p>
                  <p className="mt-1 text-slate-900">{contract.numero_contrato}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Número do Processo</p>
                  <p className="mt-1 text-slate-900">{contract.numero_processo}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-slate-600">Objeto</p>
                  <p className="mt-1 text-slate-900">{contract.objeto}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Contratado</p>
                  <p className="mt-1 text-slate-900">{contract.contratado}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">CNPJ/CPF</p>
                  <p className="mt-1 text-slate-900">{contract.cnpj_cpf}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valores e Prazos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-600">Valor Inicial</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(contract.valor_inicial)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Valor Atual</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(contract.valor_atual)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Data de Assinatura</p>
                  <p className="mt-1 text-slate-900">{formatBrazilianDate(contract.data_assinatura)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Prazo</p>
                  <p className="mt-1 text-slate-900">{contract.prazo_meses} meses</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Início da Vigência</p>
                  <p className="mt-1 text-slate-900">{formatBrazilianDate(contract.data_inicio_vigencia)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Fim da Vigência</p>
                  <p className="mt-1 text-slate-900">{formatBrazilianDate(contract.data_fim_vigencia)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestor e Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-900">Gestor</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Nome</p>
                      <p className="mt-1 text-slate-900">{contract.gestor_nome}</p>
                    </div>
                    {contract.gestor_email && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">E-mail</p>
                        <p className="mt-1 text-slate-900">{contract.gestor_email}</p>
                      </div>
                    )}
                    {contract.gestor_telefone && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">Telefone</p>
                        <p className="mt-1 text-slate-900">{contract.gestor_telefone}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-900">Fiscal</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Nome</p>
                      <p className="mt-1 text-slate-900">{contract.fiscal_nome}</p>
                    </div>
                    {contract.fiscal_email && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">E-mail</p>
                        <p className="mt-1 text-slate-900">{contract.fiscal_email}</p>
                      </div>
                    )}
                    {contract.fiscal_telefone && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">Telefone</p>
                        <p className="mt-1 text-slate-900">{contract.fiscal_telefone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {contract.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-900">{contract.observacoes}</p>
                </CardContent>
              </Card>
            )}

            {/* Amendments */}
            {amendments && amendments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Aditivos e Apostilamentos ({amendments.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {amendments.map((amendment) => (
                    <div key={amendment.id} className="rounded-lg border bg-slate-50 p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{amendment.numero}</span>
                        <Badge className={getTipoColor(amendment.tipo)}>{getTipoLabel(amendment.tipo)}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-900">{amendment.descricao}</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <div>
                          <span className="font-medium">Data:</span>{" "}
                          {formatBrazilianDate(amendment.data)}
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
                            {formatBrazilianDate(amendment.nova_data_fim)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Extensions */}
            {extensions && extensions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prorrogações ({extensions.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extensions.map((extension) => (
                    <div key={extension.id} className="rounded-lg border bg-slate-50 p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          Prorrogação de {extension.prazo_meses} meses
                        </span>
                        <Badge
                          className={
                            extension.status === "aprovada"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : extension.status === "rejeitada"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                          }
                        >
                          {extension.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-900">{extension.justificativa}</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <div>
                          <span className="font-medium">Data da Solicitação:</span>{" "}
                          {formatBrazilianDate(extension.data_solicitacao)}
                        </div>
                        <div>
                          <span className="font-medium">Nova Data de Fim:</span>{" "}
                          {formatBrazilianDate(extension.nova_data_fim)}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Files */}
            {files && files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos ({files.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {files.map((file) => (
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
                            {formatBrazilianDate(file.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <Link href={`/api/contratos/${contract.id}/files/${file.id}/download`} target="_blank">
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Download className="h-4 w-4" />
                          Baixar
                        </Button>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          <p>© 2025 UENP - Universidade Estadual do Norte do Paraná</p>
          <p className="mt-2">Sistema de Gestão de Contratos Públicos - Consulta Pública</p>
        </div>
      </footer>
    </div>
  )
}
