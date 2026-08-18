-- =========================================================
-- MIGRATIE: contractensysteem toevoegen aan een bestaand project
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'concept',

  organizer_name text not null,
  organizer_company text,
  organizer_email text not null,
  organizer_phone text,
  organizer_address text,
  organizer_vat text,

  event_type text,
  event_date date,
  event_start_time text,
  event_end_time text,
  venue_name text,
  venue_address text,
  guest_count integer,
  technical_notes text,
  repertoire_notes text,

  fee_amount text,
  vat_note text,
  deposit_amount text,
  deposit_due text,
  balance_due text,

  image_rights boolean not null default true,
  internal_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table contracts enable row level security;

drop policy if exists "Beheerder leest - contracts" on contracts;
create policy "Beheerder leest - contracts" on contracts for select to authenticated using (true);

drop policy if exists "Beheerder schrijft - contracts insert" on contracts;
create policy "Beheerder schrijft - contracts insert" on contracts for insert to authenticated with check (true);

drop policy if exists "Beheerder schrijft - contracts update" on contracts;
create policy "Beheerder schrijft - contracts update" on contracts for update to authenticated using (true);

drop policy if exists "Beheerder schrijft - contracts delete" on contracts;
create policy "Beheerder schrijft - contracts delete" on contracts for delete to authenticated using (true);

insert into site_texts (key, value) values
  ('contract_company_name', 'Nikita Unbound'),
  ('contract_company_address', 'Gent, België'),
  ('contract_bank_iban', ''),
  ('contract_vat_default', '(nog te bepalen)'),
  ('contract_cancellation_policy', 'Bij annulering door de opdrachtgever tot 30 dagen voor het optreden is 25% van de gage verschuldigd als annuleringsvergoeding. Bij annulering binnen de 30 dagen voor het optreden is de volledige gage verschuldigd. Bij overmacht langs de kant van Nikita Unbound (bv. ziekte) wordt in onderling overleg een alternatieve datum voorgesteld, of wordt een reeds betaald voorschot volledig terugbetaald.'),
  ('contract_image_rights_text', 'De opdrachtgever gaat ermee akkoord dat er tijdens het optreden beeld- en/of geluidsopnames gemaakt mogen worden, die Nikita Unbound mag gebruiken voor promotionele doeleinden (o.a. website en sociale media).'),
  ('contract_footer_note', 'Dit document is met zorg opgesteld als praktische overeenkomst tussen beide partijen, maar vormt geen juridisch bindend model opgesteld door een jurist. Bij twijfel raden we aan dit te laten nakijken.')
on conflict (key) do nothing;
