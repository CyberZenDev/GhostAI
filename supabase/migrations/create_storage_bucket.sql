-- Enable storage
create extension if not exists "storage" schema "extensions";

-- Create s3 bucket
insert into storage.buckets (id, name, public)
values ('s3', 's3', true)
on conflict (id) do nothing;

-- Allow public access to files
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 's3' );

-- Allow authenticated uploads
create policy "Authenticated Users can upload files"
on storage.objects for insert
with check (
  auth.role() = 'authenticated'
  and bucket_id = 's3'
); 