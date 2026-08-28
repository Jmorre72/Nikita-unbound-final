-- =========================================================
-- MIGRATIE: standaardbedrag, vervoerskosten en voorschot
-- instelbaar maken voor nieuwe contracten.
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

insert into site_texts (key, value) values
  ('contract_default_fee', '€ 81,90'),
  ('contract_default_travel', '€ 23,40'),
  ('contract_default_deposit', '€ 100')
on conflict (key) do nothing;
