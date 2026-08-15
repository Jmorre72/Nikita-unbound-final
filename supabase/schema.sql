-- =========================================================
-- NIKITA UNBOUND — Supabase database schema
-- Voer dit volledige bestand één keer uit in:
-- Supabase dashboard → SQL Editor → New query → plakken → Run
-- =========================================================

-- ---------- Teksten (bewerkbare stukjes copy op de site) ----------
create table if not exists site_texts (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ---------- Foto's ----------
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Optredens / kalender ----------
create table if not exists gigs (
  id uuid primary key default gen_random_uuid(),
  gig_date date not null,
  title text not null,
  location text not null,
  status text not null default 'private', -- 'open' of 'private'
  status_label text not null default 'Besloten',
  created_at timestamptz not null default now()
);

-- ---------- Repertoire ----------
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  decade text not null, -- '60s','70s','80s','90s','2000s','2010s'
  created_at timestamptz not null default now()
);

-- =========================================================
-- Rijbeveiliging (Row Level Security)
-- Iedereen mag lezen (voor de publieke website).
-- Enkel ingelogde beheerders mogen toevoegen/wijzigen/verwijderen.
-- =========================================================
alter table site_texts enable row level security;
alter table photos enable row level security;
alter table gigs enable row level security;
alter table songs enable row level security;

-- Lezen: iedereen (ook niet-ingelogde bezoekers van de website)
create policy "Publiek lezen - site_texts" on site_texts for select using (true);
create policy "Publiek lezen - photos" on photos for select using (true);
create policy "Publiek lezen - gigs" on gigs for select using (true);
create policy "Publiek lezen - songs" on songs for select using (true);

-- Schrijven: enkel ingelogde gebruikers (de beheerder)
create policy "Beheerder schrijft - site_texts insert" on site_texts for insert to authenticated with check (true);
create policy "Beheerder schrijft - site_texts update" on site_texts for update to authenticated using (true);
create policy "Beheerder schrijft - site_texts delete" on site_texts for delete to authenticated using (true);

create policy "Beheerder schrijft - photos insert" on photos for insert to authenticated with check (true);
create policy "Beheerder schrijft - photos update" on photos for update to authenticated using (true);
create policy "Beheerder schrijft - photos delete" on photos for delete to authenticated using (true);

create policy "Beheerder schrijft - gigs insert" on gigs for insert to authenticated with check (true);
create policy "Beheerder schrijft - gigs update" on gigs for update to authenticated using (true);
create policy "Beheerder schrijft - gigs delete" on gigs for delete to authenticated using (true);

create policy "Beheerder schrijft - songs insert" on songs for insert to authenticated with check (true);
create policy "Beheerder schrijft - songs update" on songs for update to authenticated using (true);
create policy "Beheerder schrijft - songs delete" on songs for delete to authenticated using (true);

-- =========================================================
-- Standaardteksten (dezelfde teksten die nu al op de site staan)
-- =========================================================
insert into site_texts (key, value) values
  ('hero_eyebrow', 'Live muziek op maat van uw gelegenheid'),
  ('hero_title', 'Sfeervolle klanken,<br><em>onbegrensd</em> gevoel.'),
  ('hero_lede', 'Nikita Unbound giet tijdloze nummers van de jaren 60 tot vandaag in een intiem, akoestisch jasje. Warme stem, meeslepende percussie — de perfecte soundtrack voor uw trouwreceptie, tuinfeest of bedrijfsevent.'),
  ('about_eyebrow', 'Over Nikita Unbound'),
  ('about_title', 'Twee muzikanten, één intieme klank'),
  ('about_text', 'Nikita''s warme, frisse stem en Jan''s doorleefde percussie versmelten tot akoestische versies van nummers die u kent en herkent — van jaren 60 klassiekers tot hedendaagse hits. Geen strak podiumshow, wel een oprechte, meeslepende luisterervaring die perfect past bij kleinschalige en persoonlijke gelegenheden.'),
  ('nikita_bio', 'Met haar frisse, warme stem is Nikita het kloppend hart van de band. Ze weet elk nummer een persoonlijke, ingetogen kleur te geven — van een tere ballad tot een meeslepende klassieker. Haar zang staat centraal in de akoestische, intieme signatuur van Nikita Unbound.'),
  ('jan_bio', 'Jan brengt jarenlange muzikale ervaring mee en zorgt met subtiele, gevoelige percussie voor de puls onder elk nummer. Zijn spel is nooit dominant, maar geeft de songs precies de beweging en warmte die ze nodig hebben.'),
  ('booking_lede', 'Vul onderstaand formulier in en we bezorgen u vrijblijvend meer informatie of een offerte op maat.')
on conflict (key) do nothing;

-- =========================================================
-- Standaard optredens (voorbeeld — pas gerust aan via het beheerpaneel)
-- =========================================================
insert into gigs (gig_date, title, location, status, status_label) values
  ('2026-09-12', 'Trouwreceptie — Familie Peeters', 'Kasteel ter Linden, Gent', 'private', 'Besloten'),
  ('2026-09-27', 'Zomerterras concert', 'Café De Veerman, Gent', 'open', 'Vrij toegankelijk'),
  ('2026-10-10', 'Personeelsfeest — jaarlijkse receptie', 'Bedrijvenpark Oost, Destelbergen', 'private', 'Besloten'),
  ('2026-11-01', 'Tuinfeest najaarseditie', 'Domein Groenveld, Merelbeke', 'open', 'Vrij toegankelijk')
on conflict do nothing;

-- =========================================================
-- Standaard repertoire
-- =========================================================
insert into songs (title, artist, decade) values
  ('Fly Me to the Moon', 'Frank Sinatra', '60s'),
  ('The Sound of Silence', 'Simon & Garfunkel', '60s'),
  ('Ain''t No Sunshine', 'Bill Withers', '70s'),
  ('Killing Me Softly', 'Roberta Flack', '70s'),
  ('Sweet Dreams', 'Eurythmics', '80s'),
  ('Wicked Game', 'Chris Isaak', '80s'),
  ('No Woman No Cry', 'Bob Marley', '70s'),
  ('Nothing Compares 2 U', 'Sinéad O''Connor', '90s'),
  ('Ironic', 'Alanis Morissette', '90s'),
  ('Songbird', 'Fleetwood Mac', '70s'),
  ('Skinny Love', 'Bon Iver', '2010s'),
  ('Someone Like You', 'Adele', '2010s'),
  ('Budapest', 'George Ezra', '2010s'),
  ('Riptide', 'Vance Joy', '2010s'),
  ('Dog Days Are Over', 'Florence + the Machine', '2010s'),
  ('Coming Home', 'Leon Bridges', '2010s'),
  ('Cornerstone', 'Arctic Monkeys', '2000s'),
  ('Ho Hey', 'The Lumineers', '2010s'),
  ('Sunday Morning', 'Maroon 5', '2000s'),
  ('Halo', 'Beyoncé', '2000s')
on conflict do nothing;

-- =========================================================
-- Foto's opslag (bucket)
-- Dit kan niet via SQL — zie instructies.html stap 4:
-- Storage → New bucket → naam "photos" → Public bucket: AAN
-- =========================================================
