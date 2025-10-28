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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const tipo = formData.get("tipo") as string

    if (!file) {
      return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.includes("pdf")) {
      return NextResponse.json({ error: "Apenas arquivos PDF são permitidos" }, { status: 400 })
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileName = `${params.id}/${timestamp}-${file.name}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("contract-files").upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Error uploading file:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    // Save file metadata to database
    const { error: dbError } = await supabase.from("contract_files").insert({
      contract_id: params.id,
      tipo,
      nome_arquivo: file.name,
      storage_path: fileName,
      tamanho_bytes: file.size,
      uploaded_by: user.id,
    })

    if (dbError) {
      console.error("[v0] Error saving file metadata:", dbError)
      // Try to delete the uploaded file
      await supabase.storage.from("contract-files").remove([fileName])
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in POST /api/contratos/[id]/files:", error)
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 })
  }
}
