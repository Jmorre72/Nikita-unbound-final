-- =========================================================
-- MIGRATIE: standaard rijksregisternummer en rekeningnummer
-- per muzikant, zodat deze automatisch ingevuld kunnen worden
-- bij het aanmaken van een contract.
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

alter table musicians add column if not exists rrn text;
alter table musicians add column if not exists iban text;
