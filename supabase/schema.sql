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

-- ---------- Muziek (opnames) ----------
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meta text default '',
  audio_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Video's ----------
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  source_type text not null default 'embed', -- 'embed' (YouTube/Vimeo-link) of 'upload' (eigen bestand)
  video_url text not null,
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
alter table tracks enable row level security;
alter table videos enable row level security;

-- Lezen: iedereen (ook niet-ingelogde bezoekers van de website)
drop policy if exists "Publiek lezen - site_texts" on site_texts;
create policy "Publiek lezen - site_texts" on site_texts for select using (true);
drop policy if exists "Publiek lezen - photos" on photos;
create policy "Publiek lezen - photos" on photos for select using (true);
drop policy if exists "Publiek lezen - gigs" on gigs;
create policy "Publiek lezen - gigs" on gigs for select using (true);
drop policy if exists "Publiek lezen - songs" on songs;
create policy "Publiek lezen - songs" on songs for select using (true);
drop policy if exists "Publiek lezen - tracks" on tracks;
create policy "Publiek lezen - tracks" on tracks for select using (true);
drop policy if exists "Publiek lezen - videos" on videos;
create policy "Publiek lezen - videos" on videos for select using (true);

-- Schrijven: enkel ingelogde gebruikers (de beheerder)
drop policy if exists "Beheerder schrijft - site_texts insert" on site_texts;
create policy "Beheerder schrijft - site_texts insert" on site_texts for insert to authenticated with check (true);
drop policy if exists "Beheerder schrijft - site_texts update" on site_texts;
create policy "Beheerder schrijft - site_texts update" on site_texts for update to authenticated using (true);
drop policy if exists "Beheerder schrijft - site_texts delete" on site_texts;
create policy "Beheerder schrijft - site_texts delete" on site_texts for delete to authenticated using (true);

drop policy if exists "Beheerder schrijft - photos insert" on photos;
create policy "Beheerder schrijft - photos insert" on photos for insert to authenticated with check (true);
drop policy if exists "Beheerder schrijft - photos update" on photos;
create policy "Beheerder schrijft - photos update" on photos for update to authenticated using (true);
drop policy if exists "Beheerder schrijft - photos delete" on photos;
create policy "Beheerder schrijft - photos delete" on photos for delete to authenticated using (true);

drop policy if exists "Beheerder schrijft - tracks insert" on tracks;
create policy "Beheerder schrijft - tracks insert" on tracks for insert to authenticated with check (true);
drop policy if exists "Beheerder schrijft - tracks update" on tracks;
create policy "Beheerder schrijft - tracks update" on tracks for update to authenticated using (true);
drop policy if exists "Beheerder schrijft - tracks delete" on tracks;
create policy "Beheerder schrijft - tracks delete" on tracks for delete to authenticated using (true);

drop policy if exists "Beheerder schrijft - videos insert" on videos;
create policy "Beheerder schrijft - videos insert" on videos for insert to authenticated with check (true);
drop policy if exists "Beheerder schrijft - videos update" on videos;
create policy "Beheerder schrijft - videos update" on videos for update to authenticated using (true);
drop policy if exists "Beheerder schrijft - videos delete" on videos;
create policy "Beheerder schrijft - videos delete" on videos for delete to authenticated using (true);

drop policy if exists "Beheerder schrijft - gigs insert" on gigs;
create policy "Beheerder schrijft - gigs insert" on gigs for insert to authenticated with check (true);
drop policy if exists "Beheerder schrijft - gigs update" on gigs;
create policy "Beheerder schrijft - gigs update" on gigs for update to authenticated using (true);
drop policy if exists "Beheerder schrijft - gigs delete" on gigs;
create policy "Beheerder schrijft - gigs delete" on gigs for delete to authenticated using (true);

drop policy if exists "Beheerder schrijft - songs insert" on songs;
create policy "Beheerder schrijft - songs insert" on songs for insert to authenticated with check (true);
drop policy if exists "Beheerder schrijft - songs update" on songs;
create policy "Beheerder schrijft - songs update" on songs for update to authenticated using (true);
drop policy if exists "Beheerder schrijft - songs delete" on songs;
create policy "Beheerder schrijft - songs delete" on songs for delete to authenticated using (true);

-- =========================================================
-- Standaardteksten (dezelfde teksten die nu al op de site staan)
-- =========================================================
insert into site_texts (key, value) values
  ('nav_home', 'Home'),
  ('nav_muzikanten', 'Muzikanten'),
  ('nav_repertoire', 'Repertoire'),
  ('nav_kalender', 'Kalender'),
  ('nav_media', 'Beluister'),
  ('nav_fotos', 'Foto''s'),
  ('nav_boeking', 'Boeking'),
  ('cta_boeking_btn', 'Naar boekingsinformatie'),
  ('footer_blurb', 'Sfeervolle akoestische muziek voor trouwrecepties, recepties, tuinfeesten en personeelsfeesten.'),
  ('footer_nav_heading', 'Navigatie'),
  ('footer_contact_heading', 'Contact'),
  ('footer_email', 'bookings@nikita-unbound.be'),
  ('footer_phone', '+32 470 00 00 00'),
  ('footer_city', 'Gent, België'),
  ('social_instagram_url', ''),
  ('social_facebook_url', ''),
  ('privacy_last_updated', 'augustus 2026'),
  ('privacy_contact_name', 'Nikita Unbound'),
  ('footer_copyright', 'Nikita Unbound. Alle rechten voorbehouden.'),
  ('footer_tagline', 'Akoestisch • Intiem • Onbegrensd'),
  ('splash_cta', 'Kom binnen, en ontdek Nikita Unbound.'),
  ('hero_background_url', ''),
  ('hero_eyebrow', 'Live muziek op maat van uw gelegenheid'),
  ('hero_title', 'Sfeervolle klanken,<br><em>onbegrensd</em> gevoel.'),
  ('hero_lede', 'Nikita Unbound giet tijdloze nummers van de jaren 60 tot vandaag in een intiem, akoestisch jasje. Warme stem, meeslepende percussie — de perfecte soundtrack voor uw trouwreceptie, tuinfeest of bedrijfsevent.'),
  ('hero_btn_boeking', 'Vraag een boeking aan'),
  ('hero_btn_media', 'Beluister ons'),
  ('occasions_eyebrow', 'Voor elke gelegenheid'),
  ('occasions_title', 'De juiste sfeer, elke keer'),
  ('occasions_lead', 'Van een fluisterzacht huwelijksmoment tot een levendige receptie: wij stemmen ons repertoire en onze klank af op uw gelegenheid.'),
  ('occasion1_title', 'Trouwrecepties'),
  ('occasion1_desc', 'Een warme, ingetogen klank tijdens het aperitief en de receptie.'),
  ('occasion2_title', 'Recepties'),
  ('occasion2_desc', 'Achtergrondmuziek met karakter, nooit opdringerig.'),
  ('occasion3_title', 'Tuinfeesten'),
  ('occasion3_desc', 'Akoestisch en flexibel opgesteld, ook buiten onder de bomen.'),
  ('occasion4_title', 'Personeelsfeesten'),
  ('occasion4_desc', 'Een verzorgde noot voor uw bedrijfsevenement.'),
  ('about_eyebrow', 'Over Nikita Unbound'),
  ('about_title', 'Twee muzikanten, één intieme klank'),
  ('about_text', 'Nikita''s warme, frisse stem en Jan''s doorleefde percussie versmelten tot akoestische versies van nummers die u kent en herkent — van jaren 60 klassiekers tot hedendaagse hits. Geen strak podiumshow, wel een oprechte, meeslepende luisterervaring die perfect past bij kleinschalige en persoonlijke gelegenheden.'),
  ('about_btn', 'Maak kennis met de muzikanten'),
  ('home_cta_eyebrow', 'Klaar om te boeken?'),
  ('home_cta_title', 'Laat ons uw feest inkleuren'),
  ('home_cta_lead', 'Bekijk onze beschikbaarheid, ontdek ons repertoire of stuur meteen een aanvraag.'),
  ('home_cta_btn1', 'Bekijk kalender'),
  ('home_cta_btn2', 'Boekingsinformatie'),
  ('muz_hero_eyebrow', 'De muzikanten'),
  ('muz_hero_title', 'Twee stemmen, één ritme'),
  ('muz_hero_lead', 'Achter Nikita Unbound schuilen twee muzikanten met een gedeelde liefde voor tijdloze songs — elk met hun eigen achtergrond en hun eigen instrument.'),
  ('muz_trio_note', 'Samen bouwden Nikita en Jan een repertoire uit dat moeiteloos schakelt tussen decennia en stijlen — steeds met hetzelfde uitgangspunt: een sfeervolle, intieme uitvoering die past bij het moment.'),
  ('muz_cta_eyebrow', 'Onze klank'),
  ('muz_cta_title', 'Akoestisch, ingetogen, tijdloos'),
  ('muz_cta_lead', 'Benieuwd hoe dat precies klinkt? Beluister opnames en bekijk live-beelden, of ontdek het volledige repertoire.'),
  ('muz_cta_btn1', 'Beluister ons'),
  ('muz_cta_btn2', 'Bekijk repertoire'),
  ('kal_hero_eyebrow', 'Agenda'),
  ('kal_hero_title', 'Aankomende optredens'),
  ('kal_hero_lead', 'Een overzicht van waar en wanneer u Nikita Unbound kan horen spelen. Sommige optredens zijn besloten feesten, andere zijn vrij toegankelijk.'),
  ('kal_cta_eyebrow', 'Uw datum nog niet gevonden?'),
  ('kal_cta_title', 'Vraag uw eigen optreden aan'),
  ('kal_cta_lead', 'Wij plannen graag mee met uw agenda. Stuur ons uw gewenste datum door via het boekingsformulier.'),
  ('rep_hero_eyebrow', 'Repertoire'),
  ('rep_hero_title', 'Nummers van jaren 60 tot vandaag'),
  ('rep_hero_lead', 'Blader door ons repertoire, filter op decennium of zoek een titel. Bent u al geboekt? Vink dan hieronder uw favoriete nummers aan.'),
  ('rep_selection_label', 'nummer(s) geselecteerd'),
  ('rep_selection_btn', 'Selectie doorsturen'),
  ('rep_form_eyebrow', 'Al geboekt?'),
  ('rep_form_title', 'Stuur uw nummerkeuze door'),
  ('rep_form_lead', 'Selecteer hierboven uw favoriete nummers uit het repertoire en vul onderstaand formulier in. Staat een nummer er niet bij? Vraag het gerust aan — we bekijken of we het kunnen instuderen tegen uw feest.'),
  ('rep_submit_btn', 'Nummerkeuze doorsturen'),
  ('rep_form_note', 'Nog geen boeking? Regel dit eerst via de <a href="boeking.html" style="text-decoration:underline;">boekingspagina</a>.'),
  ('rep_success_msg', 'Bedankt! Uw nummerkeuze is genoteerd, we nemen dit mee in de voorbereiding van uw feest.'),
  ('boek_hero_eyebrow', 'Boeking'),
  ('boek_hero_title', 'Boek Nikita Unbound voor uw feest'),
  ('boek_hero_lead', 'Van een eerste vraag tot de dag van uw evenement — dit is hoe een boeking bij ons verloopt, en alle info die u vooraf wil weten.'),
  ('info_card1_num', '2'),
  ('info_card1_title', 'Bezetting'),
  ('info_card1_desc', 'Zang en percussie, akoestisch en intiem — ideaal voor kleinere en middelgrote ruimtes, binnen of buiten.'),
  ('info_card2_num', '±45'''),
  ('info_card2_title', 'Speelduur per set'),
  ('info_card2_desc', 'Sets op maat van uw programma, met pauzes voor speeches of ander vermaak. In overleg samen te stellen.'),
  ('info_card3_num', '±60'''),
  ('info_card3_title', 'Opbouw & soundcheck'),
  ('info_card3_desc', 'Wij komen ruim op tijd voor een discrete opbouw en soundcheck, afgestemd op de locatie.'),
  ('steps_eyebrow', 'Hoe verloopt een boeking'),
  ('steps_title', 'In vier stappen naar uw optreden'),
  ('step1_title', 'Aanvraag versturen'),
  ('step1_desc', 'Vul het formulier hieronder in met de datum, locatie en aard van uw evenement.'),
  ('step2_title', 'Persoonlijk contact'),
  ('step2_desc', 'Wij nemen binnen enkele dagen contact op om details en wensen te bespreken.'),
  ('step3_title', 'Bevestiging & nummerkeuze'),
  ('step3_desc', 'Na bevestiging kan u via de repertoirepagina uw favoriete nummers selecteren of een verzoeknummer aanvragen.'),
  ('step4_title', 'Wij komen spelen'),
  ('step4_desc', 'Op de dag zelf zorgen wij voor een discrete opbouw en een sfeervol optreden op maat.'),
  ('boek_form_eyebrow', 'Informatie aanvragen'),
  ('boek_form_title', 'Vertel ons over uw feest'),
  ('booking_lede', 'Vul onderstaand formulier in en we bezorgen u vrijblijvend meer informatie of een offerte op maat.'),
  ('boek_submit_btn', 'Verstuur aanvraag'),
  ('boek_form_note', 'We behandelen uw gegevens vertrouwelijk en gebruiken ze uitsluitend om uw aanvraag te beantwoorden.'),
  ('boek_success_msg', 'Bedankt voor uw aanvraag! We nemen binnenkort contact met u op.'),
  ('media_hero_eyebrow', 'Beeld & geluid'),
  ('media_hero_title', 'Beluister en bekijk Nikita Unbound'),
  ('media_hero_lead', 'Een greep uit onze live-registraties en studio-opnames, zodat u perfect weet wat u kan verwachten op uw feest.'),
  ('videos_eyebrow', 'Video''s'),
  ('videos_title', 'Live in beeld'),
  ('audio_eyebrow', 'Opnames'),
  ('audio_title', 'Beluister onze nummers'),
  ('audio1_title', 'Fly Me to the Moon (akoestische versie)'),
  ('audio1_meta', 'Studio-opname'),
  ('audio2_title', 'Songbird'),
  ('audio2_meta', 'Live registratie'),
  ('audio3_title', 'Ho Hey'),
  ('audio3_meta', 'Studio-opname'),
  ('audio_placeholder_note', 'Voeg uw eigen MP3-bestanden toe in de map assets/audio/ en verwijs ernaar in media.html om deze spelers te laten afspelen.'),
  ('media_cta_eyebrow', 'Overtuigd?'),
  ('media_cta_title', 'Boek Nikita Unbound voor uw feest'),
  ('fotos_hero_eyebrow', 'Foto''s'),
  ('fotos_hero_title', 'Momenten in beeld'),
  ('fotos_hero_lead', 'Een sfeerbeeld van Nikita Unbound op locatie en achter de schermen.'),
  ('fotos_placeholder_note', 'De vakken met tekst zijn placeholders. Vervang deze in fotos.html door eigen foto''s: voeg de bestanden toe aan assets/ en verwijs ernaar met een <img>-tag, zoals bij de eerste foto.'),
  ('fotos_cta_eyebrow', 'Zelf meemaken?'),
  ('fotos_cta_title', 'Boek Nikita Unbound voor uw feest')
on conflict (key) do nothing;

-- =========================================================
-- Muzikanten
-- =========================================================
create table if not exists musicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  age integer,
  bio text not null default '',
  photo_url text,
  photo_pos_x integer not null default 50,
  photo_pos_y integer not null default 50,
  rrn text,
  iban text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table musicians enable row level security;

drop policy if exists "Publiek lezen - musicians" on musicians;
create policy "Publiek lezen - musicians" on musicians for select using (true);

drop policy if exists "Beheerder schrijft - musicians insert" on musicians;
create policy "Beheerder schrijft - musicians insert" on musicians for insert to authenticated with check (true);

drop policy if exists "Beheerder schrijft - musicians update" on musicians;
create policy "Beheerder schrijft - musicians update" on musicians for update to authenticated using (true);

drop policy if exists "Beheerder schrijft - musicians delete" on musicians;
create policy "Beheerder schrijft - musicians delete" on musicians for delete to authenticated using (true);

-- Standaard muzikanten (enkel ingevoegd als de tabel nog leeg is,
-- zodat dit veilig meermaals uitgevoerd kan worden)
insert into musicians (name, role, age, bio, sort_order)
select * from (values
  ('Nikita', 'Lead zang', 27, 'Met haar frisse, warme stem is Nikita het kloppend hart van de band. Ze weet elk nummer een persoonlijke, ingetogen kleur te geven — van een tere ballad tot een meeslepende klassieker. Haar zang staat centraal in de akoestische, intieme signatuur van Nikita Unbound.', 0),
  ('Jan', 'Percussie', 54, 'Jan brengt jarenlange muzikale ervaring mee en zorgt met subtiele, gevoelige percussie voor de puls onder elk nummer. Zijn spel is nooit dominant, maar geeft de songs precies de beweging en warmte die ze nodig hebben.', 1)
) as v(name, role, age, bio, sort_order)
where not exists (select 1 from musicians);

-- =========================================================
-- Standaard optredens (voorbeeld — pas gerust aan via het beheerpaneel)
-- Enkel ingevoegd als de tabel nog leeg is (veilig herhaalbaar).
-- =========================================================
insert into gigs (gig_date, title, location, status, status_label)
select * from (values
  ('2026-09-12'::date, 'Trouwreceptie — Familie Peeters', 'Kasteel ter Linden, Gent', 'private', 'Besloten'),
  ('2026-09-27'::date, 'Zomerterras concert', 'Café De Veerman, Gent', 'open', 'Vrij toegankelijk'),
  ('2026-10-10'::date, 'Personeelsfeest — jaarlijkse receptie', 'Bedrijvenpark Oost, Destelbergen', 'private', 'Besloten'),
  ('2026-11-01'::date, 'Tuinfeest najaarseditie', 'Domein Groenveld, Merelbeke', 'open', 'Vrij toegankelijk')
) as v(gig_date, title, location, status, status_label)
where not exists (select 1 from gigs);

-- =========================================================
-- Standaard repertoire (enkel ingevoegd als de tabel nog leeg is)
-- =========================================================
insert into songs (title, artist, decade)
select * from (values
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
) as v(title, artist, decade)
where not exists (select 1 from songs);

-- =========================================================
-- Foto's opslag (bucket)
-- Het aanmaken van de bucket zelf kan niet via SQL — zie
-- instructies.html stap 3: Storage → New bucket → naam "photos"
-- → Public bucket: AAN
--
-- Onderstaande policies MOETEN wel via SQL (of de Policies-UI
-- van de bucket) ingesteld worden. Zonder deze policies mag
-- iedereen de foto's wel BEKIJKEN (dankzij "Public bucket"),
-- maar mag niemand — ook niet de ingelogde beheerder — een
-- foto UPLOADEN of VERWIJDEREN. Dat geeft de foutmelding
-- "new row violates row-level security policy".
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

-- =========================================================
-- Muziekbestanden opslag (bucket "audio")
-- Maak deze zelf aan: Storage → New bucket → naam "audio" →
-- Public bucket: AAN. Onderstaande policies geven daarna
-- dezelfde rechten als bij de "photos"-bucket hierboven.
-- =========================================================
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

-- =========================================================
-- Videobestanden opslag (bucket "videos")
-- Maak deze zelf aan: Storage → New bucket → naam "videos" →
-- Public bucket: AAN. Enkel nodig als je zelf video-bestanden
-- wil uploaden — bij een YouTube/Vimeo-link is dit niet nodig.
-- =========================================================
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

-- =========================================================
-- Contracten
-- BELANGRIJK: bevat persoonsgegevens en financiële afspraken
-- van organisatoren. In tegenstelling tot de andere tabellen
-- is dit NIET publiek leesbaar — enkel de ingelogde beheerder
-- kan contracten lezen, aanmaken, bewerken of verwijderen.
-- =========================================================
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'concept', -- concept, verzonden, ondertekend, geannuleerd

  -- Organisator
  organizer_name text not null,
  organizer_company text,
  organizer_email text not null,
  organizer_phone text,
  organizer_address text,
  organizer_vat text,

  -- Optreden
  event_type text,
  event_date date,
  event_start_time text,
  event_end_time text,
  venue_name text,
  venue_address text,
  guest_count integer,
  technical_notes text,
  repertoire_notes text,

  -- Vergoeding
  fee_amount text,
  vat_note text,
  deposit_amount text,
  deposit_due text,
  balance_due text,

  -- Vergoeding per muzikant (Working in the Arts / AKV of regulier)
  -- JSON-array: [{ name, rijksregisternummer, iban, sessions: [{ type: 'optreden'|'repetitie', date, amount, payment_method: 'wita'|'regulier', travel_allowance }] }]
  musician_payments jsonb not null default '[]'::jsonb,
  uses_wita boolean not null default false,

  -- Extra
  image_rights boolean not null default true,
  internal_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table contracts enable row level security;

-- Geen enkele publieke lees-policy: standaard is alles dus
-- verborgen voor niet-ingelogde bezoekers.
drop policy if exists "Beheerder leest - contracts" on contracts;
create policy "Beheerder leest - contracts" on contracts for select to authenticated using (true);

drop policy if exists "Beheerder schrijft - contracts insert" on contracts;
create policy "Beheerder schrijft - contracts insert" on contracts for insert to authenticated with check (true);

drop policy if exists "Beheerder schrijft - contracts update" on contracts;
create policy "Beheerder schrijft - contracts update" on contracts for update to authenticated using (true);

drop policy if exists "Beheerder schrijft - contracts delete" on contracts;
create policy "Beheerder schrijft - contracts delete" on contracts for delete to authenticated using (true);

-- =========================================================
-- Standaardteksten voor contracten (herbruikt de bestaande
-- site_texts-tabel, bewerkbaar via Beheer → Teksten)
-- =========================================================
insert into site_texts (key, value) values
  ('contract_company_name', 'Nikita Unbound'),
  ('contract_company_address', 'Gent, België'),
  ('contract_bank_iban', ''),
  ('contract_vat_default', '(nog te bepalen)'),
  ('contract_cancellation_policy', 'Bij annulering door de opdrachtgever tot 30 dagen voor het optreden is 25% van de gage verschuldigd als annuleringsvergoeding. Bij annulering binnen de 30 dagen voor het optreden is de volledige gage verschuldigd. Bij overmacht langs de kant van Nikita Unbound (bv. ziekte) wordt in onderling overleg een alternatieve datum voorgesteld, of wordt een reeds betaald voorschot volledig terugbetaald.'),
  ('contract_image_rights_text', 'De opdrachtgever gaat ermee akkoord dat er tijdens het optreden beeld- en/of geluidsopnames gemaakt mogen worden, die Nikita Unbound mag gebruiken voor promotionele doeleinden (o.a. website en sociale media).'),
  ('contract_wita_instructions', 'Voor muzikanten die (deels) via de amateurkunstenvergoeding (Working in the Arts) betaald worden, moet u als opdrachtgever elke prestatie vooraf registreren:

1. Ga naar www.workinginthearts.be en meld u aan (als opdrachtgever) met uw eID of itsme.
2. Klik op ''Geef een opdracht aan'' en registreer elke sessie (optreden en eventuele repetitie) apart, VOOR de datum waarop die plaatsvindt.
3. Vul per sessie de datum, het overeengekomen bedrag (max. EUR 81,90 per dag per muzikant in 2026) en eventuele verplaatsingsvergoeding (max. EUR 23,40 per dag) in.
4. De muzikant moet zelf ook eenmalig geregistreerd zijn als kunstenaar op hetzelfde platform.

Meer info: www.workinginthearts.be'),
  ('contract_footer_note', 'Dit document is met zorg opgesteld als praktische overeenkomst tussen beide partijen, maar vormt geen juridisch bindend model opgesteld door een jurist. Bij twijfel raden we aan dit te laten nakijken.')
on conflict (key) do nothing;

-- =========================================================
-- Activiteitenlogboek — houdt bij wie wat wijzigde via het
-- beheerpaneel. Enkel leesbaar/schrijfbaar voor ingelogde
-- beheerders, nooit publiek (en nooit aanpasbaar/verwijderbaar
-- achteraf — een logboek moet betrouwbaar blijven).
-- =========================================================
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  admin_email text,
  action text not null,
  details text
);

alter table activity_log enable row level security;

drop policy if exists "Beheerder leest - activity_log" on activity_log;
create policy "Beheerder leest - activity_log" on activity_log for select to authenticated using (true);

drop policy if exists "Beheerder schrijft - activity_log insert" on activity_log;
create policy "Beheerder schrijft - activity_log insert" on activity_log for insert to authenticated with check (true);

-- =========================================================
-- Websitebezoeken — lichtgewicht, anonieme paginateller.
-- Geen cookies, geen IP-adressen, geen persoonsgegevens: enkel
-- een tijdstip en welke pagina bezocht werd. Bezoekers zelf
-- (niet ingelogd) mogen een bezoek registreren; enkel de
-- beheerder kan de resultaten uitlezen.
-- =========================================================
create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page text not null,
  country text
);

alter table page_views enable row level security;

drop policy if exists "Iedereen registreert - page_views" on page_views;
create policy "Iedereen registreert - page_views" on page_views for insert with check (true);

drop policy if exists "Beheerder leest - page_views" on page_views;
create policy "Beheerder leest - page_views" on page_views for select to authenticated using (true);
