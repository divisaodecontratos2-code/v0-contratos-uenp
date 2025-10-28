"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper function to parse Brazilian date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
function parseBrazilianDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null

  const cleaned = dateStr.trim()
  const parts = cleaned.split("/")

  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  return null
}

// Helper function to parse Brazilian currency format (R$ 1.234,56) to number
function parseBrazilianCurrency(valueStr: string): number {
  if (!valueStr || valueStr.trim() === "") return 0

  const cleaned = valueStr.replace(/R\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".").trim()

  return Number.parseFloat(cleaned) || 0
}

// Helper function to extract email from contact string
function extractEmail(contactStr: string): string {
  if (!contactStr) return ""
  const emailMatch = contactStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return emailMatch ? emailMatch[0] : ""
}

// Helper function to extract phone from contact string
function extractPhone(contactStr: string): string {
  if (!contactStr) return ""
  // Remove common separators and extract numbers
  const numbers = contactStr.replace(/[^\d]/g, "")
  if (numbers.length >= 10) {
    // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    const ddd = numbers.slice(0, 2)
    const firstPart = numbers.slice(2, numbers.length - 4)
    const lastPart = numbers.slice(-4)
    return `(${ddd}) ${firstPart}-${lastPart}`
  }
  return contactStr.trim()
}

// Helper function to calculate months between two dates
function calculateMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return Math.max(0, months)
}

// Helper function to normalize status
function normalizeStatus(status: string): string {
  const normalized = status.toLowerCase().trim()
  if (normalized.includes("vigente") || normalized.includes("ativo")) return "vigente"
  if (normalized.includes("encerrado") || normalized.includes("finalizado")) return "encerrado"
  if (normalized.includes("suspenso")) return "suspenso"
  if (normalized.includes("rescindido") || normalized.includes("cancelado")) return "rescindido"
  return "vigente"
}

export async function importContractsFromCSV(csvText: string) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.email !== "dir.adm@uenp.edu.br") {
      return { success: false, message: "Não autorizado" }
    }

    // Parse CSV
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) {
      return { success: false, message: "CSV vazio ou inválido" }
    }

    // Get headers
    const headers = lines[0].split(",").map((h) => h.trim())

    // Process each row
    const contracts = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim())

        if (values.length < headers.length) {
          errors.push(`Linha ${i + 1}: Número de colunas insuficiente`)
          continue
        }

        // Create object from headers and values
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })

        // Map CSV columns to database schema
        const numeroContrato = row["Nº CONTRATO UENP"] || row["NUMERO_CONTRATO"] || row["numero_contrato"] || ""
        const objeto = row["OBJETO"] || row["objeto"] || ""
        const contratada = row["CONTRATADA"] || row["CONTRATADO"] || row["contratado"] || ""
        const valorStr = row["VALOR"] || row["valor"] || "0"
        const inicioVigencia = row["INÍCIO DA VIGÊNCIA"] || row["inicio_vigencia"] || row["data_inicio_vigencia"] || ""
        const fimVigencia = row["FIM DA VIGÊNCIA"] || row["fim_vigencia"] || row["data_fim_vigencia"] || ""
        const status = row["STATUS"] || row["status"] || row["situacao"] || "vigente"
        const processo = row["PROCESSO"] || row["processo"] || row["numero_processo"] || ""
        const gestorNome = row["GESTOR DO CONTRATO"] || row["gestor_nome"] || ""
        const gestorContato = row["CONTATO"] || values[headers.indexOf("CONTATO")] || ""
        const fiscalNome = row["FISCAL DO CONTRATO"] || row["fiscal_nome"] || ""
        const fiscalContato = values[headers.indexOf("CONTATO", headers.indexOf("FISCAL DO CONTRATO"))] || ""
        const prorrogavel = row["PREVISÃO DE PRORROGAÇÃO"] || row["prorrogavel"] || "NÃO"

        // Additional fields
        const categoria = row["CATEGORIA"] || ""
        const numeroGms = row["Nº GMS"] || ""
        const modalidade = row["MODALIDADE"] || ""
        const modalidadeNumero = row["MODALIDADE N°"] || ""
        const nomeacaoGestor = row["NOMEAÇÃO"] || values[headers.indexOf("NOMEAÇÃO")] || ""
        const nomeacaoFiscal = values[headers.indexOf("NOMEAÇÃO", headers.indexOf("FISCAL DO CONTRATO"))] || ""

        // Validate required fields
        if (!numeroContrato || !objeto || !contratada) {
          errors.push(`Linha ${i + 1}: Campos obrigatórios faltando (número do contrato, objeto ou contratada)`)
          continue
        }

        // Parse dates
        const dataInicio = parseBrazilianDate(inicioVigencia)
        const dataFim = parseBrazilianDate(fimVigencia)

        if (!dataInicio || !dataFim) {
          errors.push(`Linha ${i + 1}: Datas inválidas`)
          continue
        }

        // Parse value
        const valor = parseBrazilianCurrency(valorStr)

        // Calculate months
        const prazoMeses = calculateMonths(dataInicio, dataFim)

        // Extract contact info
        const gestorEmail = extractEmail(gestorContato)
        const gestorTelefone = extractPhone(gestorContato)
        const fiscalEmail = extractEmail(fiscalContato)
        const fiscalTelefone = extractPhone(fiscalContato)

        // Build observacoes with extra info
        const observacoes = [
          categoria ? `Categoria: ${categoria}` : "",
          numeroGms ? `Nº GMS: ${numeroGms}` : "",
          modalidade ? `Modalidade: ${modalidade}` : "",
          modalidadeNumero ? `Modalidade Nº: ${modalidadeNumero}` : "",
          nomeacaoGestor ? `Nomeação Gestor: ${nomeacaoGestor}` : "",
          nomeacaoFiscal ? `Nomeação Fiscal: ${nomeacaoFiscal}` : "",
        ]
          .filter(Boolean)
          .join(" | ")

        // Create contract object
        const contract = {
          numero_contrato: numeroContrato,
          numero_processo: processo,
          objeto: objeto,
          contratado: contratada,
          cnpj_cpf: "",
          valor_inicial: valor,
          valor_atual: valor,
          data_assinatura: dataInicio,
          data_inicio_vigencia: dataInicio,
          data_fim_vigencia: dataFim,
          prazo_meses: prazoMeses,
          prorrogavel: prorrogavel.toUpperCase() === "SIM" || prorrogavel.toLowerCase() === "true",
          situacao: normalizeStatus(status),
          gestor_nome: gestorNome,
          gestor_email: gestorEmail,
          gestor_telefone: gestorTelefone,
          fiscal_nome: fiscalNome,
          fiscal_email: fiscalEmail,
          fiscal_telefone: fiscalTelefone,
          observacoes: observacoes || null,
        }

        contracts.push(contract)
      } catch (error) {
        errors.push(
          `Linha ${i + 1}: Erro ao processar - ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        )
      }
    }

    if (contracts.length === 0) {
      return {
        success: false,
        message: `Nenhum contrato válido encontrado. Erros: ${errors.join("; ")}`,
      }
    }

    // Insert contracts into database
    const { data, error } = await supabase.from("contracts").insert(contracts).select()

    if (error) {
      return {
        success: false,
        message: `Erro ao inserir contratos no banco de dados: ${error.message}`,
      }
    }

    // Revalidate paths
    revalidatePath("/admin")
    revalidatePath("/admin/contratos")
    revalidatePath("/consulta")

    return {
      success: true,
      message: `${contracts.length} contrato(s) importado(s) com sucesso!`,
      imported: contracts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao processar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

export async function clearAllContracts() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.email !== "dir.adm@uenp.edu.br") {
      return { error: "Não autorizado" }
    }

    // Delete all contracts
    const { error } = await supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows

    if (error) {
      return { error: error.message }
    }

    // Revalidate paths
    revalidatePath("/admin")
    revalidatePath("/admin/contratos")
    revalidatePath("/consulta")

    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}
