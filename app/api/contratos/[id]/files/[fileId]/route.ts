import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, props: { params: Promise<{ id: string; fileId: string }> }) {
  try {
    const params = await props.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from("contract_files")
      .select("storage_path")
      .eq("id", params.fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("contract-files").remove([file.storage_path])

    if (storageError) {
      console.error("[v0] Error deleting file from storage:", storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase.from("contract_files").delete().eq("id", params.fileId)

    if (dbError) {
      console.error("[v0] Error deleting file metadata:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/contratos/[id]/files/[fileId]:", error)
    return NextResponse.json({ error: "Erro ao excluir arquivo" }, { status: 500 })
  }
}
