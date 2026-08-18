/* =========================================================
   NIKITA UNBOUND — text-fields.js
   Centrale lijst van alle bewerkbare teksten op de website.
   Wordt gebruikt door admin.html om automatisch een invoerveld
   per tekst te tonen, gegroepeerd per pagina.

   Om een nieuw bewerkbaar tekststuk toe te voegen:
   1. Zet in de betreffende .html-pagina een data-key="jouw_sleutel"
      attribuut op het element.
   2. Voeg hieronder een regel toe met dezelfde sleutel.
   3. Voeg de standaardwaarde toe aan supabase/schema.sql.
   ========================================================= */

window.TEXT_FIELDS = [

  // ---------- Welkomstscherm ----------
  { key: 'splash_cta', page: 'Welkomstscherm', label: 'Linktekst', type: 'text' },

  // ---------- Home ----------
  { key: 'hero_eyebrow', page: 'Home', label: 'Hero — label boven titel', type: 'text' },
  { key: 'hero_title', page: 'Home', label: 'Hero — hoofdtitel (HTML zoals <br> en <em> toegelaten)', type: 'textarea' },
  { key: 'hero_lede', page: 'Home', label: 'Hero — inleidende alinea', type: 'textarea' },
  { key: 'hero_btn_boeking', page: 'Home', label: 'Hero — knop "Vraag een boeking aan"', type: 'text' },
  { key: 'hero_btn_beluister', page: 'Home', label: 'Hero — knop "Beluister ons"', type: 'text' },
  { key: 'occasions_eyebrow', page: 'Home', label: 'Gelegenheden — label', type: 'text' },
  { key: 'occasions_title', page: 'Home', label: 'Gelegenheden — titel', type: 'text' },
  { key: 'occasions_text', page: 'Home', label: 'Gelegenheden — inleidende zin', type: 'textarea' },
  { key: 'occasion_1_title', page: 'Home', label: 'Kaart 1 — titel', type: 'text' },
  { key: 'occasion_1_text', page: 'Home', label: 'Kaart 1 — tekst', type: 'textarea' },
  { key: 'occasion_2_title', page: 'Home', label: 'Kaart 2 — titel', type: 'text' },
  { key: 'occasion_2_text', page: 'Home', label: 'Kaart 2 — tekst', type: 'textarea' },
  { key: 'occasion_3_title', page: 'Home', label: 'Kaart 3 — titel', type: 'text' },
  { key: 'occasion_3_text', page: 'Home', label: 'Kaart 3 — tekst', type: 'textarea' },
  { key: 'occasion_4_title', page: 'Home', label: 'Kaart 4 — titel', type: 'text' },
  { key: 'occasion_4_text', page: 'Home', label: 'Kaart 4 — tekst', type: 'textarea' },
  { key: 'about_eyebrow', page: 'Home', label: '"Over Nikita Unbound" — label', type: 'text' },
  { key: 'about_title', page: 'Home', label: '"Over Nikita Unbound" — titel', type: 'text' },
  { key: 'about_text', page: 'Home', label: '"Over Nikita Unbound" — tekst', type: 'textarea' },
  { key: 'about_btn', page: 'Home', label: '"Over Nikita Unbound" — knoptekst', type: 'text' },
  { key: 'home_cta_eyebrow', page: 'Home', label: 'Slotsectie — label', type: 'text' },
  { key: 'home_cta_title', page: 'Home', label: 'Slotsectie — titel', type: 'text' },
  { key: 'home_cta_text', page: 'Home', label: 'Slotsectie — tekst', type: 'textarea' },
  { key: 'home_cta_btn_kalender', page: 'Home', label: 'Slotsectie — knop "Bekijk kalender"', type: 'text' },
  { key: 'home_cta_btn_boeking', page: 'Home', label: 'Slotsectie — knop "Boekingsinformatie"', type: 'text' },

  // ---------- Muzikanten ----------
  { key: 'muzikanten_eyebrow', page: 'Muzikanten', label: 'Titelblok — label', type: 'text' },
  { key: 'muzikanten_h1', page: 'Muzikanten', label: 'Titelblok — titel', type: 'text' },
  { key: 'muzikanten_intro', page: 'Muzikanten', label: 'Titelblok — inleidende tekst', type: 'textarea' },
  { key: 'muzikanten_note', page: 'Muzikanten', label: 'Kadertekst onder de muzikanten', type: 'textarea' },
  { key: 'muzikanten_cta_eyebrow', page: 'Muzikanten', label: 'Slotsectie — label', type: 'text' },
  { key: 'muzikanten_cta_title', page: 'Muzikanten', label: 'Slotsectie — titel', type: 'text' },
  { key: 'muzikanten_cta_text', page: 'Muzikanten', label: 'Slotsectie — tekst', type: 'textarea' },
  { key: 'muzikanten_cta_btn_beluister', page: 'Muzikanten', label: 'Slotsectie — knop "Beluister ons"', type: 'text' },
  { key: 'muzikanten_cta_btn_repertoire', page: 'Muzikanten', label: 'Slotsectie — knop "Bekijk repertoire"', type: 'text' },

  // ---------- Kalender ----------
  { key: 'kalender_eyebrow', page: 'Kalender', label: 'Titelblok — label', type: 'text' },
  { key: 'kalender_h1', page: 'Kalender', label: 'Titelblok — titel', type: 'text' },
  { key: 'kalender_intro', page: 'Kalender', label: 'Titelblok — inleidende tekst', type: 'textarea' },
  { key: 'kalender_cta_eyebrow', page: 'Kalender', label: 'Slotsectie — label', type: 'text' },
  { key: 'kalender_cta_title', page: 'Kalender', label: 'Slotsectie — titel', type: 'text' },
  { key: 'kalender_cta_text', page: 'Kalender', label: 'Slotsectie — tekst', type: 'textarea' },
  { key: 'kalender_cta_btn', page: 'Kalender', label: 'Slotsectie — knoptekst', type: 'text' },

  // ---------- Repertoire ----------
  { key: 'repertoire_eyebrow', page: 'Repertoire', label: 'Titelblok — label', type: 'text' },
  { key: 'repertoire_h1', page: 'Repertoire', label: 'Titelblok — titel', type: 'text' },
  { key: 'repertoire_intro', page: 'Repertoire', label: 'Titelblok — inleidende tekst', type: 'textarea' },
  { key: 'repertoire_form_eyebrow', page: 'Repertoire', label: 'Formulier — label', type: 'text' },
  { key: 'repertoire_form_title', page: 'Repertoire', label: 'Formulier — titel', type: 'text' },
  { key: 'repertoire_form_text', page: 'Repertoire', label: 'Formulier — inleidende tekst', type: 'textarea' },
  { key: 'repertoire_form_btn', page: 'Repertoire', label: 'Formulier — knoptekst', type: 'text' },
  { key: 'repertoire_form_note', page: 'Repertoire', label: 'Formulier — voetnoot', type: 'textarea' },
  { key: 'repertoire_form_success', page: 'Repertoire', label: 'Formulier — bevestigingsbericht', type: 'textarea' },

  // ---------- Boeking ----------
  { key: 'boeking_eyebrow', page: 'Boeking', label: 'Titelblok — label', type: 'text' },
  { key: 'boeking_h1', page: 'Boeking', label: 'Titelblok — titel', type: 'text' },
  { key: 'boeking_intro', page: 'Boeking', label: 'Titelblok — inleidende tekst', type: 'textarea' },
  { key: 'boeking_info1_num', page: 'Boeking', label: 'Infokaart 1 — cijfer/tekst', type: 'text' },
  { key: 'boeking_info1_title', page: 'Boeking', label: 'Infokaart 1 — titel', type: 'text' },
  { key: 'boeking_info1_text', page: 'Boeking', label: 'Infokaart 1 — tekst', type: 'textarea' },
  { key: 'boeking_info2_num', page: 'Boeking', label: 'Infokaart 2 — cijfer/tekst', type: 'text' },
  { key: 'boeking_info2_title', page: 'Boeking', label: 'Infokaart 2 — titel', type: 'text' },
  { key: 'boeking_info2_text', page: 'Boeking', label: 'Infokaart 2 — tekst', type: 'textarea' },
  { key: 'boeking_info3_num', page: 'Boeking', label: 'Infokaart 3 — cijfer/tekst', type: 'text' },
  { key: 'boeking_info3_title', page: 'Boeking', label: 'Infokaart 3 — titel', type: 'text' },
  { key: 'boeking_info3_text', page: 'Boeking', label: 'Infokaart 3 — tekst', type: 'textarea' },
  { key: 'boeking_steps_eyebrow', page: 'Boeking', label: 'Stappen — label', type: 'text' },
  { key: 'boeking_steps_title', page: 'Boeking', label: 'Stappen — titel', type: 'text' },
  { key: 'boeking_step1_title', page: 'Boeking', label: 'Stap 1 — titel', type: 'text' },
  { key: 'boeking_step1_text', page: 'Boeking', label: 'Stap 1 — tekst', type: 'textarea' },
  { key: 'boeking_step2_title', page: 'Boeking', label: 'Stap 2 — titel', type: 'text' },
  { key: 'boeking_step2_text', page: 'Boeking', label: 'Stap 2 — tekst', type: 'textarea' },
  { key: 'boeking_step3_title', page: 'Boeking', label: 'Stap 3 — titel', type: 'text' },
  { key: 'boeking_step3_text', page: 'Boeking', label: 'Stap 3 — tekst', type: 'textarea' },
  { key: 'boeking_step4_title', page: 'Boeking', label: 'Stap 4 — titel', type: 'text' },
  { key: 'boeking_step4_text', page: 'Boeking', label: 'Stap 4 — tekst', type: 'textarea' },
  { key: 'boeking_form_eyebrow', page: 'Boeking', label: 'Formulier — label', type: 'text' },
  { key: 'boeking_form_title', page: 'Boeking', label: 'Formulier — titel', type: 'text' },
  { key: 'booking_lede', page: 'Boeking', label: 'Formulier — inleidende zin', type: 'textarea' },
  { key: 'boeking_form_btn', page: 'Boeking', label: 'Formulier — knoptekst', type: 'text' },
  { key: 'boeking_form_note', page: 'Boeking', label: 'Formulier — voetnoot', type: 'textarea' },
  { key: 'boeking_form_success', page: 'Boeking', label: 'Formulier — bevestigingsbericht', type: 'textarea' },

  // ---------- Beluister ----------
  { key: 'media_eyebrow', page: 'Beluister', label: 'Titelblok — label', type: 'text' },
  { key: 'media_h1', page: 'Beluister', label: 'Titelblok — titel', type: 'text' },
  { key: 'media_intro', page: 'Beluister', label: 'Titelblok — inleidende tekst', type: 'textarea' },
  { key: 'media_video_eyebrow', page: 'Beluister', label: 'Video\'s — label', type: 'text' },
  { key: 'media_video_title', page: 'Beluister', label: 'Video\'s — titel', type: 'text' },
  { key: 'media_video_note', page: 'Beluister', label: 'Video\'s — hulptekst', type: 'textarea' },
  { key: 'media_audio_eyebrow', page: 'Beluister', label: 'Opnames — label', type: 'text' },
  { key: 'media_audio_title', page: 'Beluister', label: 'Opnames — titel', type: 'text' },
  { key: 'media_audio_note', page: 'Beluister', label: 'Opnames — hulptekst', type: 'textarea' },
  { key: 'media_cta_eyebrow', page: 'Beluister', label: 'Slotsectie — label', type: 'text' },
  { key: 'media_cta_title', page: 'Beluister', label: 'Slotsectie — titel', type: 'text' },
  { key: 'media_cta_btn', page: 'Beluister', label: 'Slotsectie — knoptekst', type: 'text' },

  // ---------- Foto's ----------
  { key: 'fotos_eyebrow', page: "Foto's", label: 'Titelblok — label', type: 'text' },
  { key: 'fotos_h1', page: "Foto's", label: 'Titelblok — titel', type: 'text' },
  { key: 'fotos_intro', page: "Foto's", label: 'Titelblok — inleidende tekst', type: 'textarea' },
  { key: 'fotos_note', page: "Foto's", label: 'Hulptekst onder de galerij', type: 'textarea' },
  { key: 'fotos_cta_eyebrow', page: "Foto's", label: 'Slotsectie — label', type: 'text' },
  { key: 'fotos_cta_title', page: "Foto's", label: 'Slotsectie — titel', type: 'text' },
  { key: 'fotos_cta_btn', page: "Foto's", label: 'Slotsectie — knoptekst', type: 'text' },

  // ---------- Footer (overal op de site) ----------
  { key: 'footer_tagline', page: 'Footer (overal)', label: 'Korte omschrijving', type: 'textarea' },
  { key: 'footer_email', page: 'Footer (overal)', label: 'E-mailadres', type: 'text' },
  { key: 'footer_phone', page: 'Footer (overal)', label: 'Telefoonnummer', type: 'text' },
  { key: 'footer_city', page: 'Footer (overal)', label: 'Stad/land', type: 'text' },
  { key: 'social_instagram_url', page: 'Footer (overal)', label: 'Instagram-link', type: 'text' },
  { key: 'social_facebook_url', page: 'Footer (overal)', label: 'Facebook-link', type: 'text' },
  { key: 'privacy_contact_name', page: 'Footer (overal)', label: 'Privacybeleid: naam verwerkingsverantwoordelijke', type: 'text' },
  { key: 'privacy_last_updated', page: 'Footer (overal)', label: 'Privacybeleid: datum laatste update', type: 'text' },
  { key: 'footer_slogan', page: 'Footer (overal)', label: 'Slagzin rechts onderaan', type: 'text' },
];
