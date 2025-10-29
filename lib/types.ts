export interface Contract {
  id: string
  numero_contrato: string
  numero_processo: string
  numero_gms?: string | null
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
  situacao: "vigente" | "encerrado" | "suspenso" | "rescindido"
  gestor_nome: string
  gestor_email?: string
  gestor_telefone?: string
  fiscal_nome: string
  fiscal_email?: string
  fiscal_telefone?: string
  observacoes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface ContractFile {
  id: string
  contract_id: string
  tipo: "contrato" | "extrato" | "aditivo" | "apostilamento" | "portaria" | "outro"
  nome_arquivo: string
  storage_path: string
  tamanho_bytes?: number
  uploaded_at: string
  uploaded_by?: string
}

export interface ContractAmendment {
  id: string
  contract_id: string
  tipo: "aditivo_prazo" | "aditivo_valor" | "aditivo_misto" | "apostilamento"
  numero: string
  data: string
  descricao: string
  valor_alteracao?: number
  prazo_alteracao_meses?: number
  nova_data_fim?: string
  justificativa?: string
  created_at: string
  created_by?: string
}

export interface ContractExtension {
  id: string
  contract_id: string
  data_solicitacao: string
  prazo_meses: number
  nova_data_fim: string
  justificativa: string
  status: "pendente" | "aprovada" | "rejeitada"
  created_at: string
  created_by?: string
}

export interface ExpiringContract extends Contract {
  dias_restantes: number
}
