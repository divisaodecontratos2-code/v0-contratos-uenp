import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { csv } = await request.json()

    // Parse CSV
    const lines = csv.trim().split("\n")
    const headers = lines[0].split(",").map((h: string) => h.trim())

    const contracts = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v: string) => v.trim())

        if (values.length !== headers.length) {
          errors.push(`Linha ${i + 1}: Número incorreto de colunas`)
          continue
        }

        const contract: Record<string, unknown> = {}
        headers.forEach((header: string, index: number) => {
          const normalizedHeader = header.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          let key = header
          if (header === "Nº GMS" || normalizedHeader === "No GMS" || normalizedHeader === "N GMS") {
            key = "numero_gms"
          }

          let value: string | number | boolean = values[index]

          // Convert types
          if (key === "valor_inicial" || key === "valor_atual") {
            value = Number.parseFloat(value)
          } else if (key === "prazo_meses") {
            value = Number.parseInt(value)
          } else if (key === "prorrogavel") {
            value = value.toLowerCase() === "true"
          }

          contract[key] = value
        })

        contract.created_by = user.id
        contracts.push(contract)
      } catch (error) {
        errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : "Erro ao processar"}`)
      }
    }

    // Insert contracts
    let successCount = 0
    if (contracts.length > 0) {
      const { error, count } = await supabase.from("contracts").insert(contracts)

      if (error) {
        console.error("[v0] Error importing contracts:", error)
        errors.push(`Erro ao inserir contratos: ${error.message}`)
      } else {
        successCount = count || contracts.length
      }
    }

    return NextResponse.json({
      success: successCount,
      errors,
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/contratos/import:", error)
    return NextResponse.json({ error: "Erro ao importar contratos" }, { status: 500 })
  }
}
