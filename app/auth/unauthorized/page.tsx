import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Sistema de Contratos</h1>
          <p className="mt-2 text-slate-600">UENP - Universidade Estadual do Norte do Paraná</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            </div>
            <CardDescription>Você não tem permissão para acessar esta área</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Esta área é restrita apenas para administradores autorizados do sistema. Se você acredita que deveria ter
              acesso, entre em contato com o administrador do sistema.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href="/consulta">Consulta Pública</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/auth/login">Fazer Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
