import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ContractForm } from "@/components/contract-form"
import { FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EditarContratoPage({ params }: { params: Promise<{ id: string }> }) {
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
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Editar Contrato</h1>
            <p className="mt-2 text-slate-600">{contract.numero_contrato}</p>
          </div>

          <ContractForm contract={contract} isEdit />
        </div>
      </main>
    </div>
  )
}
