/* =========================================================
   NIKITA UNBOUND — content.js
   Vult elementen met [data-key="..."] met de actuele tekst
   uit de Supabase-tabel "site_texts". Is Supabase niet
   gekoppeld (of nog leeg), dan blijft gewoon de standaardtekst
   staan die al in de HTML zit — de site werkt dus altijd.
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
      if (map[key] !== undefined) {
        el.innerHTML = map[key];
      }
    });
  } catch (err) {
    console.warn('Kon site-teksten niet laden uit Supabase:', err);
  }
});
