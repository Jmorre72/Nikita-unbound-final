-- =========================================================
-- MIGRATIE: achtergrondfoto instelbaar maken via het beheerpaneel
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

insert into site_texts (key, value) values ('hero_background_url', '')
on conflict (key) do nothing;
