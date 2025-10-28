"use client"

import type React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        router.push("/admin")
        router.refresh()
      }
    } catch (error: unknown) {
      let errorMessage = "Erro ao fazer login"

      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos"
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Sistema de Contratos</h1>
          <p className="mt-2 text-slate-600">UENP - Universidade Estadual do Norte do Paraná</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login Administrativo</CardTitle>
            <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@uenp.edu.br"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Primeiro acesso?{" "}
                  <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                    Criar conta de administrador
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
