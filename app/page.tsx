import { Button } from "@/components/ui/button"
import { FileText, Search, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
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
            <Link href="/consulta">
              <Button variant="ghost">Consulta Pública</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline">Área Administrativa</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-gradient-to-br from-blue-50 to-slate-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-balance text-5xl font-bold text-slate-900">
              Gestão Transparente de Contratos Públicos
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-slate-600">
              Sistema de gerenciamento e consulta de contratos da Universidade Estadual do Norte do Paraná.
              Transparência, eficiência e controle de prazos em uma única plataforma.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/consulta">
                <Button size="lg" className="gap-2">
                  <Search className="h-5 w-5" />
                  Consultar Contratos
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  <Shield className="h-5 w-5" />
                  Acesso Administrativo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">Funcionalidades do Sistema</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">Gestão Completa</h3>
                <p className="text-slate-600">
                  Controle total sobre contratos, aditivos, apostilamentos e prorrogações com histórico completo.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">Consulta Pública</h3>
                <p className="text-slate-600">
                  Acesso transparente a todos os contratos públicos com busca avançada e download de documentos.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">Alertas de Prazo</h3>
                <p className="text-slate-600">
                  Sistema inteligente de alertas para contratos próximos do vencimento que podem ser prorrogados.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          <p>© 2025 UENP - Universidade Estadual do Norte do Paraná</p>
          <p className="mt-2">Sistema de Gestão de Contratos Públicos</p>
        </div>
      </footer>
    </div>
  )
}
