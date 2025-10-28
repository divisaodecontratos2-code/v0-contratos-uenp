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

const DEFAULT_HEADER_ORDER = [
  "CATEGORIA",
  "Nº GMS",
  "Nº CONTRATO UENP",
  "MODALIDADE",
  "MODALIDADE Nº",
  "OBJETO",
  "CONTRATADA",
  "VALOR",
  "INÍCIO DA VIGÊNCIA",
  "FIM DA VIGÊNCIA",
  "STATUS",
  "PROCESSO",
  "GESTOR DO CONTRATO",
  "CONTATO (GESTOR)",
  "NOMEAÇÃO (GESTOR)",
  "FISCAL DO CONTRATO",
  "CONTATO (FISCAL)",
  "NOMEAÇÃO (FISCAL)",
  "PREVISÃO DE PRORROGAÇÃO",
]

function normalizeLookupKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, "o")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const HEADER_KEYWORDS = new Set(
  [
    ...DEFAULT_HEADER_ORDER,
    "NUMERO CONTRATO UENP",
    "numero_contrato",
    "Número do contrato",
    "numero contrato",
    "DESCRIÇÃO",
    "descricao",
    "contratado",
    "Fornecedor",
    "EMPRESA",
    "VALOR TOTAL",
    "valor_total",
    "valor total",
    "INICIO DA VIGENCIA",
    "inicio_vigencia",
    "data_inicio_vigencia",
    "DATA INICIO",
    "DATA INICIO VIGENCIA",
    "FIM DA VIGENCIA",
    "fim_vigencia",
    "data_fim_vigencia",
    "DATA FIM",
    "DATA FIM VIGENCIA",
    "situação",
    "situacao",
    "Nº PROCESSO",
    "NUMERO PROCESSO",
    "gestor_nome",
    "Gestor",
    "Nome do gestor",
    "fiscal_nome",
    "Fiscal",
    "Nome do fiscal",
    "CONTATO GESTOR",
    "CONTATO_GESTOR",
    "GESTOR CONTATO",
    "CONTATO",
    "CONTATO FISCAL",
    "CONTATO_FISCAL",
    "FISCAL CONTATO",
    "PREVISAO DE PRORROGACAO",
    "prorrogavel",
    "PRORROGAVEL",
    "categoria",
    "NUMERO GMS",
    "numero_gms",
    "modalidade",
    "MODALIDADE N°",
    "MODALIDADE NUMERO",
    "modalidade_numero",
    "NOMEAÇÃO GESTOR",
    "NOMEACAO GESTOR",
    "NOMEAÇÃO (GESTOR)",
    "NOMEACAO (GESTOR)",
    "NOMEAÇÃO FISCAL",
    "NOMEACAO FISCAL",
    "NOMEAÇÃO (FISCAL)",
    "NOMEACAO (FISCAL)",
  ].map((keyword) => normalizeLookupKey(keyword)),
)

type HeaderLookup = Map<string, number[]>

function detectDelimiter(csv: string): string {
  const possibleDelimiters = [";", ",", "\t", "|"]
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 5)

  let bestDelimiter = ","
  let bestScore = -1

  const quotedSectionRegex = /"(?:[^"]|"")*"/g

  for (const delimiter of possibleDelimiters) {
    let score = 0

    for (const line of lines) {
      const sanitizedLine = line.replace(quotedSectionRegex, "")
      const matches = sanitizedLine.split(delimiter).length - 1
      if (matches > 0) {
        score += matches
      }
    }

    if (score > bestScore || (score === bestScore && delimiter === ",")) {
      bestScore = score
      bestDelimiter = delimiter
    }
  }

  return bestDelimiter
}

function parseCsv(csv: string): string[][] {
  const delimiter = detectDelimiter(csv)
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]

    if (char === "\"") {
      if (inQuotes && csv[i + 1] === "\"") {
        currentValue += "\""
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === delimiter) {
      currentRow.push(currentValue)
      currentValue = ""
      continue
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      currentRow.push(currentValue)
      currentValue = ""
      rows.push(currentRow)
      currentRow = []

      if (char === "\r" && csv[i + 1] === "\n") {
        i++
      }

      continue
    }

    currentValue += char
  }

  currentRow.push(currentValue)
  rows.push(currentRow)

  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1]
    if (lastRow.length === 1 && lastRow[0].trim() === "") {
      rows.pop()
    }
  }

  return rows
}

function buildFallbackHeaders(length: number): string[] {
  const headers: string[] = []
  for (let i = 0; i < length; i++) {
    headers.push(DEFAULT_HEADER_ORDER[i] ?? `COLUNA_${i + 1}`)
  }
  return headers
}

function isLikelyHeader(row: string[]): boolean {
  if (!row || row.length === 0) return false

  const normalizedRow = row.map((value) => normalizeLookupKey(value))
  const matchCount = normalizedRow.filter((value) => HEADER_KEYWORDS.has(value)).length

  const threshold = Math.max(2, Math.ceil(row.length / 4))

  return matchCount >= threshold
}

function addLookupVariant(map: HeaderLookup, key: string, index: number) {
  if (!key) return
  const existing = map.get(key)
  if (existing) {
    if (!existing.includes(index)) {
      existing.push(index)
    }
  } else {
    map.set(key, [index])
  }
}

function buildHeaderLookup(headers: string[]): HeaderLookup {
  const lookup: HeaderLookup = new Map()

  headers.forEach((header, index) => {
    const trimmed = header?.toString().trim() ?? ""
    if (!trimmed) return

    addLookupVariant(lookup, trimmed, index)
    addLookupVariant(lookup, trimmed.toLowerCase(), index)
    addLookupVariant(lookup, normalizeLookupKey(trimmed), index)
  })

  return lookup
}

function getValueFromRow(
  rowValues: string[],
  lookup: HeaderLookup,
  possibleHeaders: string[],
  occurrence = 0,
): string {
  for (const candidate of possibleHeaders) {
    const variations = [candidate, candidate.toLowerCase(), normalizeLookupKey(candidate)]

    for (const variation of variations) {
      const indexes = lookup.get(variation)
      if (indexes && indexes.length > 0) {
        const index = indexes[Math.min(occurrence, indexes.length - 1)]
        const raw = rowValues[index]
        if (raw && raw.trim() !== "") {
          return raw.trim()
        }
      }
    }
  }

  return ""
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

    // Parse CSV using a custom parser to support different delimiters and quoted values
    const cleanedCsv = csvText.replace(/^\uFEFF/, "").trim()
    if (!cleanedCsv) {
      return { success: false, message: "CSV vazio ou inválido" }
    }

    const rows = parseCsv(cleanedCsv).filter((row) =>
      row.some((value) => (value === null || value === undefined ? "" : value.toString().trim()) !== ""),
    )

    if (!rows || rows.length === 0) {
      return { success: false, message: "CSV vazio ou inválido" }
    }

    const possibleHeaderRow = rows[0].map((header) => (header === null || header === undefined ? "" : header.toString()))
    const headerDetected = isLikelyHeader(possibleHeaderRow)

    if (headerDetected && rows.length < 2) {
      return { success: false, message: "Nenhum dado encontrado após o cabeçalho do CSV" }
    }

    const headers = headerDetected
      ? possibleHeaderRow
      : buildFallbackHeaders(possibleHeaderRow.length)

    const dataStartIndex = headerDetected ? 1 : 0

    const headerLookup = buildHeaderLookup(headers)

    // Process each row
    const contractsMap = new Map<string, {
      numero_contrato: string
      numero_processo: string
      objeto: string
      contratado: string
      cnpj_cpf: string
      valor_inicial: number
      valor_atual: number
      data_assinatura: string
      data_inicio_vigencia: string
      data_fim_vigencia: string
      prazo_meses: number
      prorrogavel: boolean
      situacao: string
      gestor_nome: string
      gestor_email: string
      gestor_telefone: string
      fiscal_nome: string
      fiscal_email: string
      fiscal_telefone: string
      observacoes: string | null
    }>()
    const duplicateContracts: string[] = []
    const errors: string[] = []

    for (let i = dataStartIndex; i < rows.length; i++) {
      const row = rows[i]

      const values = headers.map((_, index) => {
        const cell = row[index]
        if (cell === null || cell === undefined) return ""
        return cell.toString().trim()
      })

      if (values.every((value) => value === "")) {
        continue
      }

      const dataRowNumber = i + 1

      try {
        // Map CSV columns to database schema
        const numeroContrato = getValueFromRow(values, headerLookup, [
          "Nº CONTRATO UENP",
          "NUMERO CONTRATO UENP",
          "NUMERO_CONTRATO",
          "numero_contrato",
          "Número do contrato",
          "numero contrato",
        ])
        const objeto = getValueFromRow(values, headerLookup, ["OBJETO", "Objeto", "DESCRIÇÃO", "descricao", "descrição"])
        const contratada = getValueFromRow(values, headerLookup, [
          "CONTRATADA",
          "CONTRATADO",
          "contratado",
          "Fornecedor",
          "EMPRESA",
        ])
        const valorStr =
          getValueFromRow(values, headerLookup, ["VALOR", "VALOR TOTAL", "valor", "valor_total", "valor total"]) || "0"
        const inicioVigencia = getValueFromRow(values, headerLookup, [
          "INÍCIO DA VIGÊNCIA",
          "INICIO DA VIGENCIA",
          "inicio_vigencia",
          "data_inicio_vigencia",
          "DATA INICIO",
          "DATA INICIO VIGENCIA",
        ])
        const fimVigencia = getValueFromRow(values, headerLookup, [
          "FIM DA VIGÊNCIA",
          "FIM DA VIGENCIA",
          "fim_vigencia",
          "data_fim_vigencia",
          "DATA FIM",
          "DATA FIM VIGENCIA",
        ])
        const status =
          getValueFromRow(values, headerLookup, ["STATUS", "status", "situação", "situacao", "SITUAÇÃO"]) || "vigente"
        const processo = getValueFromRow(values, headerLookup, [
          "PROCESSO",
          "processo",
          "numero_processo",
          "Nº PROCESSO",
          "NUMERO PROCESSO",
        ])
        const gestorNome = getValueFromRow(values, headerLookup, [
          "GESTOR DO CONTRATO",
          "GESTOR",
          "gestor_nome",
          "Gestor",
          "Nome do gestor",
        ])
        const fiscalNome = getValueFromRow(values, headerLookup, [
          "FISCAL DO CONTRATO",
          "FISCAL",
          "fiscal_nome",
          "Fiscal",
          "Nome do fiscal",
        ])

        let gestorContato =
          getValueFromRow(values, headerLookup, [
            "CONTATO GESTOR",
            "CONTATO_GESTOR",
            "CONTATO (GESTOR)",
            "GESTOR CONTATO",
          ]) || getValueFromRow(values, headerLookup, ["CONTATO"], 0)

        let fiscalContato =
          getValueFromRow(values, headerLookup, [
            "CONTATO FISCAL",
            "CONTATO_FISCAL",
            "CONTATO (FISCAL)",
            "FISCAL CONTATO",
          ]) || getValueFromRow(values, headerLookup, ["CONTATO"], 1)

        const prorrogavel =
          getValueFromRow(values, headerLookup, [
            "PREVISÃO DE PRORROGAÇÃO",
            "PREVISAO DE PRORROGACAO",
            "prorrogavel",
            "PRORROGAVEL",
          ]) || "NÃO"

        // Additional fields
        const categoria = getValueFromRow(values, headerLookup, ["CATEGORIA", "categoria"])
        const numeroGms = getValueFromRow(values, headerLookup, ["Nº GMS", "NUMERO GMS", "numero_gms"])
        const modalidade = getValueFromRow(values, headerLookup, ["MODALIDADE", "modalidade"])
        const modalidadeNumero = getValueFromRow(values, headerLookup, [
          "MODALIDADE N°",
          "MODALIDADE Nº",
          "MODALIDADE NUMERO",
          "modalidade_numero",
        ])

        let nomeacaoGestor =
          getValueFromRow(values, headerLookup, [
            "NOMEAÇÃO GESTOR",
            "NOMEACAO GESTOR",
            "NOMEAÇÃO (GESTOR)",
            "NOMEACAO (GESTOR)",
          ]) || getValueFromRow(values, headerLookup, ["NOMEAÇÃO", "NOMEACAO"], 0)

        let nomeacaoFiscal =
          getValueFromRow(values, headerLookup, [
            "NOMEAÇÃO FISCAL",
            "NOMEACAO FISCAL",
            "NOMEAÇÃO (FISCAL)",
            "NOMEACAO (FISCAL)",
          ]) || getValueFromRow(values, headerLookup, ["NOMEAÇÃO", "NOMEACAO"], 1)

        // Ensure contacts default to empty string if undefined
        gestorContato = gestorContato || ""
        fiscalContato = fiscalContato || ""
        nomeacaoGestor = nomeacaoGestor || ""
        nomeacaoFiscal = nomeacaoFiscal || ""

        // Validate required fields
        if (!numeroContrato || !objeto || !contratada) {
          errors.push(`Linha ${dataRowNumber}: Campos obrigatórios faltando (número do contrato, objeto ou contratada)`)
          continue
        }

        // Parse dates
        const dataInicio = parseBrazilianDate(inicioVigencia)
        const dataFim = parseBrazilianDate(fimVigencia)

        if (!dataInicio || !dataFim) {
          errors.push(`Linha ${dataRowNumber}: Datas inválidas`)
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

        if (contractsMap.has(numeroContrato)) {
          duplicateContracts.push(numeroContrato)
        }

        contractsMap.set(numeroContrato, contract)
      } catch (error) {
        errors.push(
          `Linha ${dataRowNumber}: Erro ao processar - ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        )
      }
    }

    if (contractsMap.size === 0) {
      return {
        success: false,
        message: `Nenhum contrato válido encontrado. Erros: ${errors.join("; ")}`,
      }
    }

    // Insert contracts into database
    const contracts = Array.from(contractsMap.values())
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

    // Revalidate paths
    revalidatePath("/admin")
    revalidatePath("/admin/contratos")
    revalidatePath("/consulta")

    return {
      success: true,
      message: `${contracts.length} contrato(s) importado(s) com sucesso!`,
      imported: contracts.length,
      errors:
        errors.length > 0 || duplicateContracts.length > 0
          ? [
              ...errors,
              ...(duplicateContracts.length > 0
                ? [`Contratos duplicados atualizados: ${duplicateContracts.join(", ")}`]
                : []),
            ]
          : undefined,
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
