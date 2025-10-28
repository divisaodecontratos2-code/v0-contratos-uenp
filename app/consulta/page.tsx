import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Search, Home } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Contract } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function ConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const query = params.q || ""
  const situacao = params.situacao || ""

  let contractsQuery = supabase.from("contracts").select("*").order("data_fim_vigencia", { ascending: false })

  if (query) {
    contractsQuery = contractsQuery.or(
      `numero_contrato.ilike.%${query}%,objeto.ilike.%${query}%,contratado.ilike.%${query}%`,
    )
  }

  if (situacao) {
    contractsQuery = contractsQuery.eq("situacao", situacao)
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
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Consulta Pública de Contratos</h1>
            <p className="mt-2 text-slate-600">
              Acesso transparente aos contratos públicos da Universidade Estadual do Norte do Paraná
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form action="/consulta" method="get" className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      name="q"
                      placeholder="Buscar por número, objeto ou contratado..."
                      defaultValue={query}
                      className="pl-10"
                    />
                  </div>
                  <Select name="situacao" defaultValue={situacao || "all"}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todas as situações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as situações</SelectItem>
                      <SelectItem value="vigente">Vigente</SelectItem>
                      <SelectItem value="encerrado">Encerrado</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="rescindido">Rescindido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit">Buscar</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              {contracts && contracts.length > 0
                ? `${contracts.length} contrato${contracts.length !== 1 ? "s" : ""} encontrado${contracts.length !== 1 ? "s" : ""}`
                : "Nenhum contrato encontrado"}
            </p>
          </div>

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
                            {new Date(contract.data_inicio_vigencia).toLocaleDateString("pt-BR")}
                          </div>
                          <div>
                            <span className="font-medium">Fim:</span>{" "}
                            {new Date(contract.data_fim_vigencia).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                      <Link href={`/consulta/${contract.id}`}>
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
                    {query || situacao
                      ? "Tente ajustar os filtros de busca"
                      : "Não há contratos cadastrados no momento"}
                  </p>
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
