-- =========================================================
-- MIGRATIE: muziek (tracks) toevoegen aan een bestaand project
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
--
-- BELANGRIJK: maak EERST ook de opslagruimte aan:
-- Storage → New bucket → naam exact "audio" → Public bucket: AAN
-- → Create bucket. Voer daarna dit script uit.
-- =========================================================

create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meta text default '',
  audio_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tracks enable row level security;

drop policy if exists "Publiek lezen - tracks" on tracks;
create policy "Publiek lezen - tracks" on tracks for select using (true);

drop policy if exists "Beheerder schrijft - tracks insert" on tracks;
create policy "Beheerder schrijft - tracks insert" on tracks for insert to authenticated with check (true);

drop policy if exists "Beheerder schrijft - tracks update" on tracks;
create policy "Beheerder schrijft - tracks update" on tracks for update to authenticated using (true);

drop policy if exists "Beheerder schrijft - tracks delete" on tracks;
create policy "Beheerder schrijft - tracks delete" on tracks for delete to authenticated using (true);

-- Rechten op de "audio"-opslagruimte (bucket moet al bestaan, zie boven)
drop policy if exists "Publiek lezen - storage audio" on storage.objects;
create policy "Publiek lezen - storage audio"
on storage.objects for select
using ( bucket_id = 'audio' );

drop policy if exists "Beheerder upload - storage audio" on storage.objects;
create policy "Beheerder upload - storage audio"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'audio' );

drop policy if exists "Beheerder update - storage audio" on storage.objects;
create policy "Beheerder update - storage audio"
on storage.objects for update
to authenticated
using ( bucket_id = 'audio' );

drop policy if exists "Beheerder verwijdert - storage audio" on storage.objects;
create policy "Beheerder verwijdert - storage audio"
on storage.objects for delete
to authenticated
using ( bucket_id = 'audio' );
