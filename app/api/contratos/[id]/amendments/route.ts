import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await request.json()

    const { error } = await supabase.from("contract_amendments").insert({
      contract_id: params.id,
      ...data,
      created_by: user.id,
    })

    if (error) {
      console.error("[v0] Error creating amendment:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in POST /api/contratos/[id]/amendments:", error)
    return NextResponse.json({ error: "Erro ao criar aditivo" }, { status: 500 })
  }
}
