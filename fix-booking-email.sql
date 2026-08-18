-- =========================================================
-- FIX: correct e-mailadres (bookings@nikita-unbound.be) in
-- reeds opgeslagen gegevens.
-- Voer dit uit in Supabase → SQL Editor → New query → Run.
-- Veilig om meermaals te draaien, ongeacht wat er nu ingevuld staat.
-- =========================================================

update site_texts
set value = 'bookings@nikita-unbound.be'
where key = 'footer_email';
