import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, props: { params: Promise<{ id: string; fileId: string }> }) {
  try {
    const params = await props.params
    const supabase = await createClient()

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from("contract_files")
      .select("storage_path, nome_arquivo")
      .eq("id", params.fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
    }

    // Download from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("contract-files")
      .download(file.storage_path)

    if (downloadError || !fileData) {
      console.error("[v0] Error downloading file:", downloadError)
      return NextResponse.json({ error: "Erro ao baixar arquivo" }, { status: 400 })
    }

    // Return file as response
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.nome_arquivo}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/contratos/[id]/files/[fileId]/download:", error)
    return NextResponse.json({ error: "Erro ao baixar arquivo" }, { status: 500 })
  }
}
