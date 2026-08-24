-- =========================================================
-- MIGRATIE: activiteitenlogboek toevoegen aan een bestaand project
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
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
