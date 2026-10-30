grant select on storage.objects to anon, authenticated;
create policy "users upload own images"
on storage.objects for insert to authenticated
with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own images"
on storage.objects for update to authenticated
using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own images"
on storage.objects for delete to authenticated
using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);