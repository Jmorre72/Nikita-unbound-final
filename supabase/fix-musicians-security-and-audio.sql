-- =========================================================
-- BELANGRIJKE MIGRATIE — voer dit zo snel mogelijk uit.
-- 1. Beveiligingsfix: rijksregisternummer en rekeningnummer van
--    muzikanten waren tot nu toe voor IEDEREEN op het internet
--    leesbaar (niet enkel de beheerder). Dit dicht dat lek.
-- 2. Nieuwe kolom: zichtbaarheid van een muzikant op de publieke
--    website (los van of ze als contract-standaard meetellen).
-- 3. Audio per nummer in het repertoire.
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

alter table musicians add column if not exists show_on_public_page boolean not null default true;

drop policy if exists "Publiek lezen - musicians" on musicians;
drop policy if exists "Beheerder leest - musicians" on musicians;
create policy "Beheerder leest - musicians" on musicians for select to authenticated using (true);

drop view if exists musicians_public;
create view musicians_public as
  select id, name, role, age, bio, photo_url, photo_pos_x, photo_pos_y, sort_order, created_at
  from musicians
  where show_on_public_page = true;

grant select on musicians_public to anon, authenticated;

alter table songs add column if not exists audio_url text;
