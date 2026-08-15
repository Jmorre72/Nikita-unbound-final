-- =========================================================
-- MIGRATIE: fotopositie per muzikant toevoegen
-- (zodat je de foto binnen het kader kan verschuiven)
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

alter table musicians add column if not exists photo_pos_x integer not null default 50;
alter table musicians add column if not exists photo_pos_y integer not null default 50;
