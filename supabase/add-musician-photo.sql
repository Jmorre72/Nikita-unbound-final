-- =========================================================
-- MIGRATIE: foto per muzikant toevoegen
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

alter table musicians add column if not exists photo_url text;
