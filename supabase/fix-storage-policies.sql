-- =========================================================
-- FIX: ontbrekende rechten op de "photos" opslagruimte (bucket)
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien (verwijdert eerst als hij al bestaat).
-- =========================================================

drop policy if exists "Publiek lezen - storage photos" on storage.objects;
create policy "Publiek lezen - storage photos"
on storage.objects for select
using ( bucket_id = 'photos' );

drop policy if exists "Beheerder upload - storage photos" on storage.objects;
create policy "Beheerder upload - storage photos"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'photos' );

drop policy if exists "Beheerder update - storage photos" on storage.objects;
create policy "Beheerder update - storage photos"
on storage.objects for update
to authenticated
using ( bucket_id = 'photos' );

drop policy if exists "Beheerder verwijdert - storage photos" on storage.objects;
create policy "Beheerder verwijdert - storage photos"
on storage.objects for delete
to authenticated
using ( bucket_id = 'photos' );
