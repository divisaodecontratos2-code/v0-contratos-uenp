-- Enable Row Level Security on all tables
alter table public.contracts enable row level security;
alter table public.contract_files enable row level security;
alter table public.contract_amendments enable row level security;
alter table public.contract_extensions enable row level security;
alter table public.audit_logs enable row level security;

-- Contracts policies
-- Public can view all contracts (for public consultation)
create policy "contracts_select_public"
  on public.contracts for select
  using (true);

-- Only authenticated users can insert/update/delete
create policy "contracts_insert_auth"
  on public.contracts for insert
  to authenticated
  with check (true);

create policy "contracts_update_auth"
  on public.contracts for update
  to authenticated
  using (true);

create policy "contracts_delete_auth"
  on public.contracts for delete
  to authenticated
  using (true);

-- Contract files policies
-- Public can view all files
create policy "contract_files_select_public"
  on public.contract_files for select
  using (true);

-- Only authenticated users can insert/update/delete
create policy "contract_files_insert_auth"
  on public.contract_files for insert
  to authenticated
  with check (true);

create policy "contract_files_update_auth"
  on public.contract_files for update
  to authenticated
  using (true);

create policy "contract_files_delete_auth"
  on public.contract_files for delete
  to authenticated
  using (true);

-- Contract amendments policies
-- Public can view all amendments
create policy "amendments_select_public"
  on public.contract_amendments for select
  using (true);

-- Only authenticated users can insert/update/delete
create policy "amendments_insert_auth"
  on public.contract_amendments for insert
  to authenticated
  with check (true);

create policy "amendments_update_auth"
  on public.contract_amendments for update
  to authenticated
  using (true);

create policy "amendments_delete_auth"
  on public.contract_amendments for delete
  to authenticated
  using (true);

-- Contract extensions policies
-- Public can view all extensions
create policy "extensions_select_public"
  on public.contract_extensions for select
  using (true);

-- Only authenticated users can insert/update/delete
create policy "extensions_insert_auth"
  on public.contract_extensions for insert
  to authenticated
  with check (true);

create policy "extensions_update_auth"
  on public.contract_extensions for update
  to authenticated
  using (true);

create policy "extensions_delete_auth"
  on public.contract_extensions for delete
  to authenticated
  using (true);

-- Audit logs policies
-- Only authenticated users can view and insert audit logs
create policy "audit_logs_select_auth"
  on public.audit_logs for select
  to authenticated
  using (true);

create policy "audit_logs_insert_auth"
  on public.audit_logs for insert
  to authenticated
  with check (true);
