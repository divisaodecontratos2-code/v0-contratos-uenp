import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Contract } from "@/lib/types"
import { formatBrazilianDate } from "@/lib/utils"

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const query = params.q || ""

  let contractsQuery = supabase.from("contracts").select("*").order("data_fim_vigencia", { ascending: true })

  if (query) {
    contractsQuery = contractsQuery.or(
      `numero_contrato.ilike.%${query}%,objeto.ilike.%${query}%,contratado.ilike.%${query}%`,
    )
  }

  const { data: contracts } = await contractsQuery

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
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Contratos</h1>
              <p className="mt-2 text-slate-600">Gerencie todos os contratos da instituição</p>
            </div>
            <Link href="/admin/contratos/novo">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Contrato
              </Button>
            </Link>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form action="/admin/contratos" method="get" className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="q"
                    placeholder="Buscar por número, objeto ou contratado..."
                    defaultValue={query}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>
            </CardContent>
          </Card>

          {/* Contracts List */}
          <div className="space-y-4">
            {contracts && contracts.length > 0 ? (
              contracts.map((contract: Contract) => (
                <Card key={contract.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">{contract.numero_contrato}</h3>
                          <Badge className={getSituacaoColor(contract.situacao)}>{contract.situacao}</Badge>
                          {contract.prorrogavel && (
                            <Badge variant="outline" className="border-blue-600 text-blue-600">
                              Prorrogável
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{contract.objeto}</p>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                          <div>
                            <span className="font-medium">Contratado:</span> {contract.contratado}
                          </div>
                          <div>
                            <span className="font-medium">Valor Atual:</span>{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(contract.valor_atual)}
                          </div>
                          <div>
                            <span className="font-medium">Início:</span>{" "}
                            {formatBrazilianDate(contract.data_inicio_vigencia)}
                          </div>
                          <div>
                            <span className="font-medium">Fim:</span>{" "}
                            {formatBrazilianDate(contract.data_fim_vigencia)}
                          </div>
                        </div>
                      </div>
                      <Link href={`/admin/contratos/${contract.id}`}>
                        <Button variant="outline">Ver Detalhes</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="mb-4 h-12 w-12 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900">Nenhum contrato encontrado</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {query ? "Tente uma busca diferente" : "Comece cadastrando um novo contrato"}
                  </p>
                  {!query && (
                    <Link href="/admin/contratos/novo" className="mt-4">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Contrato
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
