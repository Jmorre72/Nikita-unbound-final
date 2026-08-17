-- =========================================================
-- FIX: correcte domeinnaam (www.nikita-unbound.be) in reeds
-- opgeslagen gegevens.
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien.
-- =========================================================

update site_texts
set value = 'info@nikita-unbound.be'
where key = 'footer_email' and value = 'info@nikitaunbound.be';
