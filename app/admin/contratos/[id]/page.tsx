import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Edit } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { DeleteContractButton } from "@/components/delete-contract-button"
import { ContractFiles } from "@/components/contract-files"
import { ContractAmendments } from "@/components/contract-amendments"
import { ContractExtensions } from "@/components/contract-extensions"
import { formatBrazilianDate } from "@/lib/utils"

export default async function ContratoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

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
            <Link href="/admin">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/admin/contratos">
              <Button variant="ghost">Contratos</Button>
            </Link>
            <Link href="/admin/importar">
              <Button variant="ghost">Importar</Button>
            </Link>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" type="submit">
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Page Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
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
            <div className="flex gap-2">
              <Link href={`/admin/contratos/${contract.id}/editar`}>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
              <DeleteContractButton contractId={contract.id} />
            </div>
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
                  <p className="mt-1 text-slate-900">
                    {formatBrazilianDate(contract.data_assinatura)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Prazo</p>
                  <p className="mt-1 text-slate-900">{contract.prazo_meses} meses</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Início da Vigência</p>
                  <p className="mt-1 text-slate-900">
                    {formatBrazilianDate(contract.data_inicio_vigencia)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Fim da Vigência</p>
                  <p className="mt-1 text-slate-900">
                    {formatBrazilianDate(contract.data_fim_vigencia)}
                  </p>
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

            <ContractAmendments contractId={contract.id} amendments={amendments || []} />

            <ContractExtensions contractId={contract.id} extensions={extensions || []} />

            <ContractFiles contractId={contract.id} files={files || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
