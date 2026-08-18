-- =========================================================
-- MIGRATIE: video's toevoegen aan een bestaand project
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
--
-- Wil je zelf video-bestanden kunnen uploaden (in plaats van
-- enkel YouTube/Vimeo-links plakken)? Maak dan ook nog een
-- opslagruimte aan: Storage → New bucket → naam "videos" →
-- Public bucket: AAN.
-- =========================================================

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  source_type text not null default 'embed', -- 'embed' (YouTube/Vimeo-link) of 'upload' (eigen bestand)
  video_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table videos enable row level security;

drop policy if exists "Publiek lezen - videos" on videos;
create policy "Publiek lezen - videos" on videos for select using (true);

drop policy if exists "Beheerder schrijft - videos insert" on videos;
create policy "Beheerder schrijft - videos insert" on videos for insert to authenticated with check (true);

drop policy if exists "Beheerder schrijft - videos update" on videos;
create policy "Beheerder schrijft - videos update" on videos for update to authenticated using (true);

drop policy if exists "Beheerder schrijft - videos delete" on videos;
create policy "Beheerder schrijft - videos delete" on videos for delete to authenticated using (true);

-- Onderstaande policies zijn enkel nodig als je ook de "videos"-
-- opslagruimte hierboven hebt aangemaakt (voor eigen uploads).
drop policy if exists "Publiek lezen - storage videos" on storage.objects;
create policy "Publiek lezen - storage videos"
on storage.objects for select
using ( bucket_id = 'videos' );

drop policy if exists "Beheerder upload - storage videos" on storage.objects;
create policy "Beheerder upload - storage videos"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'videos' );

drop policy if exists "Beheerder update - storage videos" on storage.objects;
create policy "Beheerder update - storage videos"
on storage.objects for update
to authenticated
using ( bucket_id = 'videos' );

drop policy if exists "Beheerder verwijdert - storage videos" on storage.objects;
create policy "Beheerder verwijdert - storage videos"
on storage.objects for delete
to authenticated
using ( bucket_id = 'videos' );
