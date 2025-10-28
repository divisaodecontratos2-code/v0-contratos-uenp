import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, FileText, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import type { ExpiringContract } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

async function getExpiringContracts(days: number): Promise<ExpiringContract[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_expiring_contracts", { days_ahead: days })

  if (error) {
    console.error("[v0] Error fetching expiring contracts:", error)
    return []
  }

  return data || []
}

async function getContractStats() {
  const supabase = await createClient()

  const [{ count: totalContracts }, { count: vigentesCount }, { data: valorTotal }] = await Promise.all([
    supabase.from("contracts").select("*", { count: "exact", head: true }),
    supabase.from("contracts").select("*", { count: "exact", head: true }).eq("situacao", "vigente"),
    supabase.from("contracts").select("valor_atual").eq("situacao", "vigente"),
  ])

  const totalValue = valorTotal?.reduce((sum, c) => sum + (c.valor_atual || 0), 0) || 0

  return {
    total: totalContracts || 0,
    vigentes: vigentesCount || 0,
    valorTotal: totalValue,
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [stats, expiring45, expiring60, expiring90] = await Promise.all([
    getContractStats(),
    getExpiringContracts(45),
    getExpiringContracts(60),
    getExpiringContracts(90),
  ])

  const criticalContracts = expiring45.filter((c) => c.prorrogavel)
  const warningContracts = expiring60.filter((c) => c.prorrogavel && c.dias_restantes > 45)
  const infoContracts = expiring90.filter((c) => c.prorrogavel && c.dias_restantes > 60)

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
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Administrativo</h1>
            <p className="mt-2 text-slate-600">Visão geral dos contratos e alertas de vencimento</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total de Contratos</CardTitle>
                <FileText className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                <p className="mt-1 text-xs text-slate-600">{stats.vigentes} vigentes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Valor Total Vigente</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats.valorTotal)}
                </div>
                <p className="mt-1 text-xs text-slate-600">Contratos ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Alertas Críticos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{criticalContracts.length}</div>
                <p className="mt-1 text-xs text-slate-600">Vencem em até 45 dias</p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts - 45 days */}
          {criticalContracts.length > 0 && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Alertas Críticos - Vencem em até 45 dias</CardTitle>
                </div>
                <CardDescription className="text-red-700">
                  Contratos prorrogáveis que requerem ação imediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{contract.numero_contrato}</span>
                          <Badge variant="destructive" className="text-xs">
                            {contract.dias_restantes} dias
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{contract.objeto}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Contratado: {contract.contratado} | Vencimento:{" "}
                          {new Date(contract.data_fim_vigencia).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Link href={`/admin/contratos/${contract.id}`}>
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning Alerts - 60 days */}
          {warningContracts.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-amber-900">Atenção - Vencem em até 60 dias</CardTitle>
                </div>
                <CardDescription className="text-amber-700">
                  Contratos prorrogáveis que precisam de planejamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {warningContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{contract.numero_contrato}</span>
                          <Badge variant="outline" className="border-amber-600 text-amber-600 text-xs">
                            {contract.dias_restantes} dias
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{contract.objeto}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Contratado: {contract.contratado} | Vencimento:{" "}
                          {new Date(contract.data_fim_vigencia).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Link href={`/admin/contratos/${contract.id}`}>
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Alerts - 90 days */}
          {infoContracts.length > 0 && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-900">Informativo - Vencem em até 90 dias</CardTitle>
                </div>
                <CardDescription className="text-blue-700">Contratos prorrogáveis para monitoramento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {infoContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{contract.numero_contrato}</span>
                          <Badge variant="outline" className="border-blue-600 text-blue-600 text-xs">
                            {contract.dias_restantes} dias
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{contract.objeto}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Contratado: {contract.contratado} | Vencimento:{" "}
                          {new Date(contract.data_fim_vigencia).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Link href={`/admin/contratos/${contract.id}`}>
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Alerts */}
          {criticalContracts.length === 0 && warningContracts.length === 0 && infoContracts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900">Nenhum alerta no momento</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Todos os contratos prorrogáveis estão com prazos adequados
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Ações Rápidas</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/admin/contratos/novo">
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Novo Contrato</h3>
                      <p className="text-sm text-slate-600">Cadastrar contrato</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/importar">
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Importar CSV</h3>
                      <p className="text-sm text-slate-600">Importar planilha</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/contratos">
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Ver Todos</h3>
                      <p className="text-sm text-slate-600">Listar contratos</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
