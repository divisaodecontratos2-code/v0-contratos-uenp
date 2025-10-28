-- Create storage bucket for contract files
insert into storage.buckets (id, name, public)
values ('contract-files', 'contract-files', true)
on conflict (id) do nothing;

-- Allow public to read files
create policy "contract_files_read_public"
  on storage.objects for select
  using (bucket_id = 'contract-files');

-- Allow authenticated users to upload files
create policy "contract_files_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'contract-files');

-- Allow authenticated users to update files
create policy "contract_files_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'contract-files');

-- Allow authenticated users to delete files
create policy "contract_files_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'contract-files');
