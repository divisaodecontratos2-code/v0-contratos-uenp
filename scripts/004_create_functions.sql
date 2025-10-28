-- Function to get contracts expiring soon
create or replace function public.get_expiring_contracts(days_ahead integer)
returns table (
  id uuid,
  numero_contrato text,
  objeto text,
  contratado text,
  data_fim_vigencia date,
  dias_restantes integer,
  prorrogavel boolean
) as $$
begin
  return query
  select 
    c.id,
    c.numero_contrato,
    c.objeto,
    c.contratado,
    c.data_fim_vigencia,
    (c.data_fim_vigencia - current_date)::integer as dias_restantes,
    c.prorrogavel
  from public.contracts c
  where c.situacao = 'vigente'
    and c.data_fim_vigencia between current_date and (current_date + days_ahead)
  order by c.data_fim_vigencia asc;
end;
$$ language plpgsql security definer;

-- Function to log audit events
create or replace function public.log_audit_event(
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_old_data jsonb default null,
  p_new_data jsonb default null
)
returns void as $$
begin
  insert into public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data);
end;
$$ language plpgsql security definer;

-- Function to update contract valor_atual when amendments are added
create or replace function public.update_contract_valor_atual()
returns trigger as $$
begin
  if new.tipo in ('aditivo_valor', 'aditivo_misto') and new.valor_alteracao is not null then
    update public.contracts
    set valor_atual = valor_atual + new.valor_alteracao
    where id = new.contract_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to update valor_atual
drop trigger if exists update_valor_atual_on_amendment on public.contract_amendments;
create trigger update_valor_atual_on_amendment
  after insert on public.contract_amendments
  for each row
  execute function public.update_contract_valor_atual();

-- Function to update contract data_fim_vigencia when amendments are added
create or replace function public.update_contract_data_fim()
returns trigger as $$
begin
  if new.tipo in ('aditivo_prazo', 'aditivo_misto') and new.nova_data_fim is not null then
    update public.contracts
    set data_fim_vigencia = new.nova_data_fim
    where id = new.contract_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to update data_fim_vigencia
drop trigger if exists update_data_fim_on_amendment on public.contract_amendments;
create trigger update_data_fim_on_amendment
  after insert on public.contract_amendments
  for each row
  execute function public.update_contract_data_fim();
