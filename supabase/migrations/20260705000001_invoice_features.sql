-- Update invoices status constraint and setup Storage bucket policies for InvoiceSync

-- 1. Modify invoices check constraint
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check (status in ('pending_review', 'unpaid', 'paid', 'confirmed'));

-- 2. Create storage bucket 'invoices' if not exists
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- 3. Storage objects RLS policies
create policy "Users can upload their own invoices"
  on storage.objects for insert
  with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own uploaded invoices"
  on storage.objects for select
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own uploaded invoices"
  on storage.objects for update
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own uploaded invoices"
  on storage.objects for delete
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
