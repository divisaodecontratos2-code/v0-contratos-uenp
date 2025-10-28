-- Create contracts table
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  numero_contrato text not null unique,
  numero_processo text not null,
  objeto text not null,
  contratado text not null,
  cnpj_cpf text not null,
  valor_inicial numeric(15, 2) not null,
  valor_atual numeric(15, 2) not null,
  data_assinatura date not null,
  data_inicio_vigencia date not null,
  data_fim_vigencia date not null,
  prazo_meses integer not null,
  prorrogavel boolean not null default false,
  situacao text not null check (situacao in ('vigente', 'encerrado', 'suspenso', 'rescindido')),
  gestor_nome text not null,
  gestor_email text,
  gestor_telefone text,
  fiscal_nome text not null,
  fiscal_email text,
  fiscal_telefone text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Create contract files table
create table if not exists public.contract_files (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  tipo text not null check (tipo in ('contrato', 'extrato', 'aditivo', 'apostilamento', 'portaria', 'outro')),
  nome_arquivo text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  uploaded_at timestamptz default now(),
  uploaded_by uuid references auth.users(id)
);

-- Create contract amendments table (aditivos)
create table if not exists public.contract_amendments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  tipo text not null check (tipo in ('aditivo_prazo', 'aditivo_valor', 'aditivo_misto', 'apostilamento')),
  numero text not null,
  data date not null,
  descricao text not null,
  valor_alteracao numeric(15, 2),
  prazo_alteracao_meses integer,
  nova_data_fim date,
  justificativa text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Create contract extensions table (prorrogações)
create table if not exists public.contract_extensions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  data_solicitacao date not null,
  prazo_meses integer not null,
  nova_data_fim date not null,
  justificativa text not null,
  status text not null check (status in ('pendente', 'aprovada', 'rejeitada')),
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Create audit log table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_contracts_numero on public.contracts(numero_contrato);
create index if not exists idx_contracts_situacao on public.contracts(situacao);
create index if not exists idx_contracts_data_fim on public.contracts(data_fim_vigencia);
create index if not exists idx_contracts_prorrogavel on public.contracts(prorrogavel);
create index if not exists idx_contract_files_contract on public.contract_files(contract_id);
create index if not exists idx_amendments_contract on public.contract_amendments(contract_id);
create index if not exists idx_extensions_contract on public.contract_extensions(contract_id);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at);

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger to contracts table
drop trigger if exists update_contracts_updated_at on public.contracts;
create trigger update_contracts_updated_at
  before update on public.contracts
  for each row
  execute function public.update_updated_at_column();
