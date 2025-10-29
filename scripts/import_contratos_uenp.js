import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseKey)

// CSV data from the user
const csvData = `CATEGORIA	Nº GMS	Nº CONTRATO UENP	MODALIDADE	MODALIDADE N°	OBJETO	CONTRATADA	VALOR	INÍCIO DA VIGÊNCIA	FIM DA VIGÊNCIA	STATUS	PROCESSO	GESTOR DO CONTRATO	CONTATO	NOMEAÇÃO	FISCAL DO CONTRATO	CONTATO	NOMEAÇÃO	PREVISÃO DE PRORROGAÇÃO
SERVIÇOS	1	001/2023	PREGÃO ELETRÔNICO	001/2023	Contratação de empresa especializada em serviços de limpeza e conservação	EMPRESA LIMPEZA LTDA	R$ 150.000,00	01/01/2023	31/12/2023	VIGENTE	001/2023	João Silva	joao.silva@uenp.edu.br / (43) 99999-0001	Portaria 001/2023	Maria Santos	maria.santos@uenp.edu.br / (43) 99999-0002	Portaria 002/2023	SIM
OBRAS	2	002/2023	CONCORRÊNCIA	001/2023	Reforma do prédio administrativo	CONSTRUTORA ABC LTDA	R$ 500.000,00	15/02/2023	15/08/2024	VIGENTE	002/2023	Pedro Costa	pedro.costa@uenp.edu.br / (43) 99999-0003	Portaria 003/2023	Ana Lima	ana.lima@uenp.edu.br / (43) 99999-0004	Portaria 004/2023	NÃO
SERVIÇOS	3	003/2023	DISPENSA	-	Serviços de manutenção de equipamentos de informática	TECH SOLUTIONS LTDA	R$ 80.000,00	01/03/2023	28/02/2024	VIGENTE	003/2023	Carlos Oliveira	carlos.oliveira@uenp.edu.br / (43) 99999-0005	Portaria 005/2023	Juliana Rocha	juliana.rocha@uenp.edu.br / (43) 99999-0006	Portaria 006/2023	SIM`

// Parse Brazilian date format (DD/MM/YYYY)
function parseBrazilianDate(dateStr) {
  if (!dateStr || dateStr === "-") return null
  const parts = dateStr.trim().split("/")
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

// Parse Brazilian currency (R$ 1.234,56)
function parseBrazilianCurrency(valueStr) {
  if (!valueStr || valueStr === "-") return 0
  const cleaned = valueStr.replace(/[R$\s.]/g, "").replace(",", ".")
  return Number.parseFloat(cleaned) || 0
}

// Extract email from contact string
function extractEmail(contactStr) {
  if (!contactStr) return ""
  const emailMatch = contactStr.match(/[\w.-]+@[\w.-]+\.\w+/)
  return emailMatch ? emailMatch[0] : ""
}

// Extract phone from contact string
function extractPhone(contactStr) {
  if (!contactStr) return ""
  const phoneMatch = contactStr.match(/$$?\d{2}$$?\s?\d{4,5}-?\d{4}/)
  return phoneMatch ? phoneMatch[0] : ""
}

// Calculate months between two dates
function calculateMonths(startDate, endDate) {
  if (!startDate || !endDate) return 12
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return Math.max(1, months)
}

// Normalize status
function normalizeStatus(status) {
  if (!status) return "vigente"
  const normalized = status.toLowerCase().trim()
  if (normalized.includes("vigente")) return "vigente"
  if (normalized.includes("encerrado") || normalized.includes("finalizado")) return "encerrado"
  if (normalized.includes("suspenso")) return "suspenso"
  return "vigente"
}

async function importContracts() {
  console.log("[v0] Starting contract import...")

  // Parse CSV
  const lines = csvData.trim().split("\n")
  const headers = lines[0].split("\t")

  console.log(`[v0] Found ${lines.length - 1} contracts to import`)

  let successCount = 0
  let errorCount = 0

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t")

    try {
      const categoria = values[0] || ""
      const numeroGms = values[1] || ""
      const numeroContrato = values[2] || ""
      const modalidade = values[3] || ""
      const modalidadeNumero = values[4] || ""
      const objeto = values[5] || ""
      const contratada = values[6] || ""
      const valor = parseBrazilianCurrency(values[7])
      const inicioVigencia = parseBrazilianDate(values[8])
      const fimVigencia = parseBrazilianDate(values[9])
      const status = values[10] || ""
      const processo = values[11] || ""
      const gestorNome = values[12] || ""
      const gestorContato = values[13] || ""
      const gestorNomeacao = values[14] || ""
      const fiscalNome = values[15] || ""
      const fiscalContato = values[16] || ""
      const fiscalNomeacao = values[17] || ""
      const prorrogacao = values[18] || ""

      const contract = {
        numero_contrato: numeroContrato,
        numero_processo: processo || modalidadeNumero,
        numero_gms: numeroGms || null,
        objeto: objeto,
        contratado: contratada,
        cnpj_cpf: "",
        valor_inicial: valor,
        valor_atual: valor,
        data_assinatura: inicioVigencia,
        data_inicio_vigencia: inicioVigencia,
        data_fim_vigencia: fimVigencia,
        prazo_meses: calculateMonths(inicioVigencia, fimVigencia),
        prorrogavel: prorrogacao.toUpperCase().includes("SIM"),
        situacao: normalizeStatus(status),
        gestor_nome: gestorNome,
        gestor_email: extractEmail(gestorContato),
        gestor_telefone: extractPhone(gestorContato),
        fiscal_nome: fiscalNome,
        fiscal_email: extractEmail(fiscalContato),
        fiscal_telefone: extractPhone(fiscalContato),
        observacoes: `Categoria: ${categoria}\nNº GMS: ${numeroGms}\nModalidade: ${modalidade} ${modalidadeNumero}\nNomeação Gestor: ${gestorNomeacao}\nNomeação Fiscal: ${fiscalNomeacao}`,
      }

      const { error } = await supabase.from("contracts").insert(contract)

      if (error) {
        console.error(`[v0] Error importing contract ${numeroContrato}:`, error.message)
        errorCount++
      } else {
        console.log(`[v0] Successfully imported contract ${numeroContrato}`)
        successCount++
      }
    } catch (err) {
      console.error(`[v0] Error processing line ${i}:`, err.message)
      errorCount++
    }
  }

  console.log(`[v0] Import complete: ${successCount} successful, ${errorCount} errors`)
}

importContracts()
