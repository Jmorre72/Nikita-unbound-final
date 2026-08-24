-- =========================================================
-- MIGRATIE: paginabezoeken-teller (met land) toevoegen aan een
-- bestaand project.
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
--
-- Privacy: er wordt nooit een IP-adres, cookie of ander
-- persoonsgegeven opgeslagen — enkel een tijdstip, de bezochte
-- pagina, en (indien beschikbaar via Cloudflare) het land.
-- =========================================================

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page text not null
);

alter table page_views add column if not exists country text;

alter table page_views enable row level security;

drop policy if exists "Iedereen registreert - page_views" on page_views;
create policy "Iedereen registreert - page_views" on page_views for insert with check (true);

drop policy if exists "Beheerder leest - page_views" on page_views;
create policy "Beheerder leest - page_views" on page_views for select to authenticated using (true);
