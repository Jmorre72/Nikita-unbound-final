/**
 * NIKITA UNBOUND — functions/log-visit.js
 * ---------------------------------------------------------
 * Cloudflare Pages Function (draait automatisch mee zodra de
 * site op Cloudflare Pages staat — geen aparte installatie
 * nodig, gewoon meeuploaden met de rest van de site).
 *
 * Doel: het land van een bezoeker bepalen via Cloudflare's
 * eigen edge-netwerk (request.cf.country), zonder ooit het
 * IP-adres zelf door te sturen of op te slaan. Enkel de
 * paginanaam + het land (bv. "BE") worden naar Supabase
 * gestuurd.
 *
 * Werkt de site (nog) niet op Cloudflare Pages? Dan bestaat
 * dit endpoint niet, en valt script.js automatisch terug op
 * een gewone (landloze) telling rechtstreeks naar Supabase.
 * ========================================================= */

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const page = (body.page || 'onbekend').toString().slice(0, 100);

    // Cloudflare voorziet dit automatisch per binnenkomend request —
    // geen extra dienst of sleutel voor nodig.
    const country = request.cf && request.cf.country ? request.cf.country : null;

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Nog niet gekoppeld (zie instructies.html) — geen fout tonen aan bezoeker.
      return new Response(JSON.stringify({ ok: false, reason: 'not_configured' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await fetch(`${supabaseUrl}/rest/v1/page_views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ page, country })
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    // Een mislukte telling mag de site nooit verstoren.
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
