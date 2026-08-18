/* =========================================================
   NIKITA UNBOUND — Supabase client
   Gedeeld door alle pagina's (openbare site + admin.html).
   ========================================================= */

function isSupabaseConfigured() {
  return Boolean(window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
}

window.supabaseClient = null;

if (isSupabaseConfigured() && window.supabase) {
  window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
