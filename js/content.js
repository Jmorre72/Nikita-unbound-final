/* =========================================================
   NIKITA UNBOUND — content.js
   Vult elementen met [data-key="..."] met de actuele tekst
   uit de Supabase-tabel "site_texts". Is Supabase niet
   gekoppeld (of nog leeg), dan blijft gewoon de standaardtekst
   staan die al in de HTML zit — de site werkt dus altijd.

   Elementen met een extra data-key-target="href" (bv. social
   media-iconen) krijgen de waarde als attribuut in plaats van
   als tekst, en worden automatisch verborgen zolang die leeg is.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return;

  try {
    const { data, error } = await window.supabaseClient
      .from('site_texts')
      .select('key, value');

    if (error || !data) return;

    const map = {};
    data.forEach(row => { map[row.key] = row.value; });

    document.querySelectorAll('[data-key]').forEach(el => {
      const key = el.dataset.key;
      if (map[key] === undefined) return;

      const target = el.dataset.keyTarget;
      if (target) {
        const value = (map[key] || '').trim();
        if (value) {
          el.setAttribute(target, value);
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      } else {
        el.innerHTML = map[key];
      }
    });

    // Achtergrondfoto (hero / pagina-koppen): CSS-variabele instellen
    // zodra er via het beheerpaneel een aangepaste foto is ingesteld.
    if (map.hero_background_url && map.hero_background_url.trim()) {
      document.documentElement.style.setProperty('--hero-bg-url', `url("${map.hero_background_url.trim()}")`);
    }
  } catch (err) {
    console.warn('Kon site-teksten niet laden uit Supabase:', err);
  }
});
