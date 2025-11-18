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

function cleanCSVValue(value?: string | null) {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed || trimmed === "-" || trimmed === "--" || trimmed.toLowerCase() === "n/a") {
    return ""
  }
  return trimmed
}

function getRowValue(
  row: Record<string, string>,
  normalizedRow: Record<string, string>,
  keys: string[],
): string {
  for (const key of keys) {
    if (!key) continue
    const directValue = row[key]
    if (directValue !== undefined) {
      const cleaned = cleanCSVValue(directValue)
      if (cleaned) return cleaned
    }

    const normalizedKey = key.toLowerCase()
    const normalizedValue = normalizedRow[normalizedKey]
    if (normalizedValue !== undefined) {
      const cleaned = cleanCSVValue(normalizedValue)
      if (cleaned) return cleaned
    }
  }

  return ""
}

function findHeaderIndex(headers: string[], label: string, fromIndex = 0) {
  const normalized = label.toLowerCase()
  for (let index = Math.max(fromIndex, 0); index < headers.length; index++) {
    if (headers[index].toLowerCase() === normalized) {
      return index
    }
  }
  return -1
}

function getHeaderValue(headers: string[], values: string[], label: string, fromIndex = 0) {
  const index = findHeaderIndex(headers, label, fromIndex)
  return index !== -1 ? values[index] || "" : ""
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
        const normalizedRow: Record<string, string> = {}
        headers.forEach((header, index) => {
          const value = values[index] || ""
          row[header] = value
          normalizedRow[header.toLowerCase()] = value
        })

        const getValue = (keys: string[]) => getRowValue(row, normalizedRow, keys)

        // Map CSV columns to database schema
        const numeroContrato = getValue(["Nº CONTRATO UENP", "NUMERO_CONTRATO", "numero_contrato"])
        const objeto = getValue(["OBJETO", "objeto"])
        const contratada = getValue(["CONTRATADA", "CONTRATADO", "contratado"])
        const valorStr = getValue(["VALOR", "valor", "valor_inicial"]) || "0"
        const inicioVigencia =
          getValue(["INÍCIO DA VIGÊNCIA", "INICIO DA VIGENCIA", "inicio_vigencia", "data_inicio_vigencia"]) || ""
        const fimVigencia =
          getValue(["FIM DA VIGÊNCIA", "FIM DA VIGENCIA", "fim_vigencia", "data_fim_vigencia"]) || ""
        const status = getValue(["STATUS", "status", "situacao"]) || "vigente"
        const processo = getValue(["PROCESSO", "Nº PROCESSO", "processo", "numero_processo"])
        const gestorNome = getValue(["GESTOR DO CONTRATO", "GESTOR", "gestor_nome"])
        const fiscalNome = getValue(["FISCAL DO CONTRATO", "FISCAL", "fiscal_nome"])
        const gestorContato =
          getValue(["CONTATO GESTOR", "GESTOR CONTATO", "CONTATO"]) || getHeaderValue(headers, values, "CONTATO")
        const fiscalContato =
          getValue(["CONTATO FISCAL", "FISCAL CONTATO"]) ||
          getHeaderValue(headers, values, "CONTATO", findHeaderIndex(headers, "FISCAL DO CONTRATO") + 1)
        const prorrogavel = getValue(["PREVISÃO DE PRORROGAÇÃO", "prorrogavel"]) || "NÃO"
        const documento = getValue(["CNPJ/CPF", "CNPJ", "CPF", "DOCUMENTO", "cnpj_cpf", "documento"])

        // Additional fields
        const categoria = getValue(["CATEGORIA"])
        const numeroGms = getValue(["Nº GMS", "NUMERO GMS"])
        const modalidade = getValue(["MODALIDADE"])
        const modalidadeNumero = getValue(["MODALIDADE N°", "MODALIDADE Nº", "modalidade_numero"])
        const nomeacaoGestor = getValue(["NOMEAÇÃO GESTOR", "NOMEAÇÃO", "NOMEACAO"])
        const nomeacaoFiscal =
          getValue(["NOMEAÇÃO FISCAL", "NOMEACAO FISCAL"]) ||
          getHeaderValue(headers, values, "NOMEAÇÃO", findHeaderIndex(headers, "FISCAL DO CONTRATO") + 1)

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

        const numeroProcessoFinal = processo || numeroGms || modalidadeNumero || numeroContrato
        const cnpjCpfFinal = documento || "Não informado"
        const gestorNomeFinal = gestorNome || "Não informado"
        const fiscalNomeFinal = fiscalNome || "Não informado"
        const dataAssinatura =
          parseBrazilianDate(getValue(["DATA DE ASSINATURA", "data_assinatura"])) || dataInicio

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
          numero_processo: numeroProcessoFinal || "Não informado",
          objeto: objeto,
          contratado: contratada,
          cnpj_cpf: cnpjCpfFinal,
          valor_inicial: valor,
          valor_atual: valor,
          data_assinatura: dataAssinatura,
          data_inicio_vigencia: dataInicio,
          data_fim_vigencia: dataFim,
          prazo_meses: prazoMeses,
          prorrogavel: prorrogavel.toUpperCase() === "SIM" || prorrogavel.toLowerCase() === "true",
          situacao: normalizeStatus(status),
          gestor_nome: gestorNomeFinal,
          gestor_email: gestorEmail,
          gestor_telefone: gestorTelefone,
          fiscal_nome: fiscalNomeFinal,
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
    const { data, error } = await supabase
      .from("contracts")
      .upsert(contracts, { onConflict: "numero_contrato" })
      .select()

    if (error) {
      return {
        success: false,
        message: `Erro ao inserir contratos no banco de dados: ${error.message}`,
      }
    }

    const affected = data?.length ?? contracts.length

    // Revalidate paths
    revalidatePath("/admin")
    revalidatePath("/admin/contratos")
    revalidatePath("/consulta")

    return {
      success: true,
      message: `${affected} contrato(s) importado(s) ou atualizado(s) com sucesso!`,
      imported: affected,
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
