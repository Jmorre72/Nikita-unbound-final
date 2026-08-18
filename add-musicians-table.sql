-- =========================================================
-- MIGRATIE: muzikanten-tabel toevoegen aan een bestaand project
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
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

-- Standaard muzikanten (enkel ingevoegd als de tabel nog leeg is)
insert into musicians (name, role, age, bio, sort_order)
select * from (values
  ('Nikita', 'Lead zang', 27, 'Met haar frisse, warme stem is Nikita het kloppend hart van de band. Ze weet elk nummer een persoonlijke, ingetogen kleur te geven — van een tere ballad tot een meeslepende klassieker. Haar zang staat centraal in de akoestische, intieme signatuur van Nikita Unbound.', 0),
  ('Jan', 'Percussie', 54, 'Jan brengt jarenlange muzikale ervaring mee en zorgt met subtiele, gevoelige percussie voor de puls onder elk nummer. Zijn spel is nooit dominant, maar geeft de songs precies de beweging en warmte die ze nodig hebben.', 1)
) as v(name, role, age, bio, sort_order)
where not exists (select 1 from musicians);
