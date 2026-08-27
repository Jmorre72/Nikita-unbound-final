/* =========================================================
   NIKITA UNBOUND — admin.js
   Logica voor het beheerpaneel (admin.html).
   Vereist een gekoppeld Supabase-project (zie instructies.html).
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const configWarning = document.getElementById('config-warning');
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');

  if (!isSupabaseConfigured()) {
    configWarning.hidden = false;
    configWarning.innerHTML = '<strong>Supabase is nog niet gekoppeld.</strong> Vul <code>js/supabase-config.js</code> in met je Project URL en sleutel — zie <a href="instructies.html">instructies.html</a>.';
    loginSection.querySelector('form').setAttribute('inert', '');
    loginSection.querySelector('#login-submit').disabled = true;
    return;
  }

  if (!window.supabaseClient) {
    configWarning.hidden = false;
    configWarning.innerHTML = '<strong>Kon geen verbinding maken met Supabase.</strong> Controleer of <code>js/supabase-config.js</code> de juiste Project URL en sleutel bevat, of dit bestand mee geüpload is naar je hosting, en of er geen ad-blocker het Supabase-script blokkeert. Open ook de browserconsole (F12 → Console) voor meer details.';
    loginSection.querySelector('form').setAttribute('inert', '');
    loginSection.querySelector('#login-submit').disabled = true;
    return;
  }

  const sb = window.supabaseClient;
  let currentAdminEmail = null;

  /* ---------- Sessiebeheer ---------- */
  sb.auth.getSession().then(({ data }) => {
    if (data.session) showDashboard(data.session);
  });

  sb.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showDashboard(session);
    } else {
      dashboardSection.hidden = true;
      loginSection.hidden = false;
    }
  });

  function showDashboard(session) {
    loginSection.hidden = true;
    dashboardSection.hidden = false;
    currentAdminEmail = session.user.email;
    document.getElementById('user-email').textContent = session.user.email;
    loadTexts();
    loadMusicians();
    loadPhotos();
    loadTracks();
    loadVideos();
    loadGigs();
    loadSongs();
    loadContracts();
    loadActivityLog();
    loadAdmins();
    loadStatistics();
  }

  /* ---------- Inloggen / uitloggen ---------- */
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const submitBtn = document.getElementById('login-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Bezig met inloggen…';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const { error } = await sb.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Inloggen';

    if (error) {
      loginError.textContent = 'Inloggen mislukt: ' + (error.message || 'onbekende fout') + '.';
      loginError.style.display = 'block';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => sb.auth.signOut());

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('[data-tab-panel]').forEach(panel => {
        panel.hidden = panel.dataset.tabPanel !== tab;
      });
    });
  });

  /* ---------- Toast ---------- */
  const toast = document.getElementById('save-toast');
  let toastTimer;
  function showToast(message, isError) {
    toast.textContent = message;
    toast.classList.toggle('is-error', Boolean(isError));
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
  }

  /* ---------- Activiteitenlogboek ---------- */
  async function logActivity(action, details) {
    try {
      await sb.from('activity_log').insert({
        admin_email: currentAdminEmail || null,
        action,
        details: details || null
      });
    } catch (err) {
      console.warn('Kon activiteit niet loggen:', err);
    }
  }

  async function loadActivityLog() {
    const listEl = document.getElementById('admin-log-list');
    if (!listEl) return;
    try {
      const { data, error } = await sb
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      renderActivityLog(data || []);
    } catch (err) {
      listEl.innerHTML = '<p class="no-results">Kon logboek niet laden.</p>';
      console.warn('Kon activiteitenlogboek niet laden:', err);
    }
  }

  function renderActivityLog(entries) {
    const listEl = document.getElementById('admin-log-list');
    if (!listEl) return;
    if (!entries.length) {
      listEl.innerHTML = '<p class="no-results">Nog geen activiteit geregistreerd.</p>';
      return;
    }
    listEl.innerHTML = entries.map(entry => {
      const d = new Date(entry.created_at);
      const dateLabel = d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeLabel = d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="admin-log-row">
          <span class="admin-log-when">${dateLabel}<br>${timeLabel}</span>
          <span class="admin-log-action">${(entry.action || '').replace(/</g, '&lt;')}</span>
          <span class="admin-log-details">${(entry.details || '').replace(/</g, '&lt;')}</span>
          <span class="admin-log-who">${(entry.admin_email || '—').replace(/</g, '&lt;')}</span>
        </div>
      `;
    }).join('');
  }

  /* ---------- Beheerders ---------- */
  function loadAdmins() {
    const emailEl = document.getElementById('admins-current-email');
    if (emailEl) emailEl.textContent = currentAdminEmail || '—';
    // Om veiligheidsredenen kan de lijst van alle beheerders niet via de
    // website zelf opgevraagd worden (vereist een geheime sleutel die nooit
    // in de browser-code mag staan) — zie de uitleg in het tabblad zelf.
  }

  /* =========================================================
     STATISTIEKEN
     ========================================================= */
  const COUNTRY_NAMES = {
    BE: 'België', NL: 'Nederland', FR: 'Frankrijk', DE: 'Duitsland', GB: 'Verenigd Koninkrijk',
    LU: 'Luxemburg', US: 'Verenigde Staten', ES: 'Spanje', IT: 'Italië', PT: 'Portugal',
    IE: 'Ierland', CH: 'Zwitserland', AT: 'Oostenrijk', PL: 'Polen', SE: 'Zweden',
    NO: 'Noorwegen', DK: 'Denemarken', FI: 'Finland', CA: 'Canada', AU: 'Australië',
    BR: 'Brazilië', IN: 'India', CN: 'China', JP: 'Japan', ZA: 'Zuid-Afrika',
    RO: 'Roemenië', TR: 'Turkije', MA: 'Marokko', GR: 'Griekenland'
  };
  function statsEsc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function countryName(code) {
    if (!code) return 'Onbekend';
    return COUNTRY_NAMES[code] || code;
  }

  async function loadStatistics() {
    const todayEl = document.getElementById('stats-today');
    const sevenEl = document.getElementById('stats-7days');
    const thirtyEl = document.getElementById('stats-30days');
    const chartEl = document.getElementById('stats-daily-chart');
    const pagesEl = document.getElementById('stats-pages-table');
    const countryEl = document.getElementById('stats-country-table');
    if (!todayEl || !chartEl) return;

    try {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);

      const { data, error } = await sb
        .from('page_views')
        .select('created_at, page, country')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      const rows = data || [];

      const now = new Date();
      const todayStr = now.toDateString();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      let todayCount = 0;
      let sevenCount = 0;
      const dayCounts = {};
      const pageCounts = {};
      const countryCounts = {};

      rows.forEach(r => {
        const d = new Date(r.created_at);
        const dayKey = d.toISOString().slice(0, 10);
        dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
        if (d.toDateString() === todayStr) todayCount++;
        if (d >= sevenDaysAgo) sevenCount++;
        const pageName = r.page || 'onbekend';
        pageCounts[pageName] = (pageCounts[pageName] || 0) + 1;
        const c = r.country || 'onbekend';
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      });

      todayEl.textContent = todayCount;
      sevenEl.textContent = sevenCount;
      thirtyEl.textContent = rows.length;

      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      const maxCount = Math.max(1, ...days.map(d => dayCounts[d] || 0));

      if (!rows.length) {
        chartEl.innerHTML = '<p class="stats-bar-empty">Nog geen bezoeken geregistreerd.</p>';
      } else {
        chartEl.innerHTML = days.map(d => {
          const count = dayCounts[d] || 0;
          const heightPct = Math.max(2, Math.round((count / maxCount) * 100));
          const label = new Date(d + 'T00:00:00').toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit' });
          return `<div class="stats-bar" style="height:${heightPct}%;" title="${label}: ${count} bezoek(en)"></div>`;
        }).join('');
      }

      const pageEntries = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
      pagesEl.innerHTML = pageEntries.length
        ? `<table><thead><tr><th>Pagina</th><th>Bezoeken</th></tr></thead><tbody>${pageEntries.map(([p, c]) => `<tr><td>${statsEsc(p)}</td><td>${c}</td></tr>`).join('')}</tbody></table>`
        : '<p class="no-results">Nog geen gegevens.</p>';

      const countryEntries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
      countryEl.innerHTML = countryEntries.length
        ? `<table><thead><tr><th>Land</th><th>Bezoeken</th></tr></thead><tbody>${countryEntries.map(([c, n]) => `<tr><td>${statsEsc(countryName(c === 'onbekend' ? null : c))}</td><td>${n}</td></tr>`).join('')}</tbody></table>`
        : '<p class="no-results">Nog geen gegevens.</p>';

    } catch (err) {
      console.warn('Kon statistieken niet laden:', err);
      chartEl.innerHTML = '<p class="stats-bar-empty">Kon statistieken niet laden.</p>';
    }
  }

  /* =========================================================
     TEKSTEN
     ========================================================= */
  async function loadTexts() {
    const { data, error } = await sb.from('site_texts').select('key, value');
    if (error) { showToast('Kon teksten niet laden.', true); return; }
    const map = {};
    (data || []).forEach(row => { map[row.key] = row.value; });
    document.querySelectorAll('[data-text-key]').forEach(field => {
      const input = field.querySelector('.text-input');
      if (map[field.dataset.textKey] !== undefined) input.value = map[field.dataset.textKey];
    });
    const bgPreview = document.getElementById('bg-photo-preview');
    if (bgPreview && map.hero_background_url && map.hero_background_url.trim()) {
      bgPreview.src = map.hero_background_url.trim();
    }
  }

  document.querySelectorAll('.btn-save-text').forEach(btn => {
    btn.addEventListener('click', async () => {
      const wrapper = btn.closest('[data-text-key]');
      const key = wrapper.dataset.textKey;
      const value = wrapper.querySelector('.text-input').value;
      btn.disabled = true;
      const { error } = await sb.from('site_texts').upsert({ key, value, updated_at: new Date().toISOString() });
      btn.disabled = false;
      showToast(error ? 'Bewaren mislukt.' : 'Bewaard.', Boolean(error));
      if (!error) logActivity('bijgewerkt', `Tekst: ${key}`);
    });
  });

  /* ---------- Achtergrondfoto ---------- */
  const bgPhotoFile = document.getElementById('bg-photo-file');
  const bgPhotoUploadBtn = document.getElementById('bg-photo-upload-btn');
  const bgPhotoResetBtn = document.getElementById('bg-photo-reset-btn');
  const bgPhotoError = document.getElementById('bg-photo-error');
  const bgPhotoPreview = document.getElementById('bg-photo-preview');

  if (bgPhotoUploadBtn) {
    bgPhotoUploadBtn.addEventListener('click', async () => {
      const file = bgPhotoFile.files[0];
      bgPhotoError.style.display = 'none';
      if (!file) {
        bgPhotoError.textContent = 'Kies eerst een foto.';
        bgPhotoError.style.display = 'block';
        return;
      }
      bgPhotoUploadBtn.disabled = true;
      bgPhotoUploadBtn.textContent = 'Bezig met uploaden…';
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const path = `background/${Date.now()}-${safeName}`;
        const { error: uploadError } = await sb.storage.from('photos').upload(path, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = sb.storage.from('photos').getPublicUrl(path);
        const url = publicUrlData.publicUrl;

        const { error: saveError } = await sb.from('site_texts').upsert({ key: 'hero_background_url', value: url, updated_at: new Date().toISOString() });
        if (saveError) throw saveError;

        bgPhotoPreview.src = url;
        bgPhotoFile.value = '';
        showToast('Achtergrondfoto bijgewerkt.');
        logActivity('bijgewerkt', 'Achtergrondfoto');
      } catch (err) {
        bgPhotoError.textContent = 'Uploaden mislukt: ' + (err.message || err);
        bgPhotoError.style.display = 'block';
        showToast('Uploaden mislukt.', true);
      } finally {
        bgPhotoUploadBtn.disabled = false;
        bgPhotoUploadBtn.textContent = 'Achtergrondfoto wijzigen';
      }
    });
  }

  if (bgPhotoResetBtn) {
    bgPhotoResetBtn.addEventListener('click', async () => {
      if (!confirm('Terugzetten naar de standaardfoto van de website?')) return;
      bgPhotoResetBtn.disabled = true;
      const { error } = await sb.from('site_texts').upsert({ key: 'hero_background_url', value: '', updated_at: new Date().toISOString() });
      bgPhotoResetBtn.disabled = false;
      if (error) { showToast('Terugzetten mislukt.', true); return; }
      bgPhotoPreview.src = 'assets/hero-photo.jpg';
      showToast('Teruggezet naar standaardfoto.');
      logActivity('bijgewerkt', 'Achtergrondfoto teruggezet naar standaard');
    });
  }

  /* =========================================================
     MUZIKANTEN
     ========================================================= */
  const musicianList = document.getElementById('admin-musician-list');

  async function uploadMusicianPhoto(file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `musicians/${Date.now()}-${safeName}`;
    const { error: uploadError } = await sb.storage.from('photos').upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = sb.storage.from('photos').getPublicUrl(path);
    return publicUrlData.publicUrl;
  }

  // Maakt een .photo-position-frame element sleepbaar (muis + touch) om
  // te bepalen welk deel van de foto zichtbaar is in het ronde/vierkante kader.
  function attachPositionDrag(frameEl) {
    const img = frameEl.querySelector('img');
    let dragging = false;

    function update(clientX, clientY) {
      const rect = frameEl.getBoundingClientRect();
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, Math.round(x)));
      y = Math.max(0, Math.min(100, Math.round(y)));
      frameEl.dataset.posX = x;
      frameEl.dataset.posY = y;
      img.style.objectPosition = `${x}% ${y}%`;
    }

    frameEl.addEventListener('pointerdown', (e) => {
      dragging = true;
      frameEl.setPointerCapture(e.pointerId);
      update(e.clientX, e.clientY);
    });
    frameEl.addEventListener('pointermove', (e) => { if (dragging) update(e.clientX, e.clientY); });
    frameEl.addEventListener('pointerup', () => { dragging = false; });
    frameEl.addEventListener('pointercancel', () => { dragging = false; });
  }

  // Toont een lokale voorvertoning van een net-gekozen bestand in de sleepbare editor,
  // vóór het geüpload is — zo kan je meteen positioneren.
  function previewPhotoInEditor(editorEl, file) {
    const frame = editorEl.querySelector('.photo-position-frame');
    const img = frame.querySelector('img');
    img.src = URL.createObjectURL(file);
    frame.dataset.posX = 50;
    frame.dataset.posY = 50;
    img.style.objectPosition = '50% 50%';
    editorEl.classList.add('is-active');
  }

  async function loadMusicians() {
    const { data, error } = await sb.from('musicians').select('*').order('sort_order', { ascending: true });
    if (error) { showToast('Kon muzikanten niet laden.', true); return; }
    renderMusicianList(data || []);
  }

  function renderMusicianList(musicians) {
    if (!musicians.length) {
      musicianList.innerHTML = '<p class="no-results">Nog geen muzikanten toegevoegd.</p>';
      return;
    }
    musicianList.innerHTML = musicians.map(m => `
      <div class="admin-list-row" data-musician-id="${m.id}" style="align-items: flex-start; flex-wrap: wrap;">
        ${m.photo_url
          ? `<img src="${m.photo_url}" alt="" class="musician-thumb" style="object-position:${m.photo_pos_x ?? 50}% ${m.photo_pos_y ?? 50}%;">`
          : `<div class="musician-thumb-placeholder">${(m.name || '?').charAt(0).toUpperCase()}</div>`}
        <div style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:220px;">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input type="text" class="row-name" value="${(m.name || '').replace(/"/g, '&quot;')}" style="flex:1; min-width:140px;">
            <input type="text" class="row-role" value="${(m.role || '').replace(/"/g, '&quot;')}" style="flex:1; min-width:140px;">
            <input type="number" class="row-age" value="${m.age ?? ''}" min="0" style="max-width:110px;" placeholder="Leeftijd">
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input type="text" class="row-rrn" value="${(m.rrn || '').replace(/"/g, '&quot;')}" placeholder="Rijksregisternummer (voor WITA)" style="flex:1; min-width:180px;">
            <input type="text" class="row-iban" value="${(m.iban || '').replace(/"/g, '&quot;')}" placeholder="Rekeningnummer / IBAN" style="flex:1; min-width:180px;">
          </div>
          <textarea class="row-bio" rows="2" style="padding:9px 11px; border:1px solid rgba(16,32,58,.18); border-radius:3px; font-family:var(--font-body); font-size:.86rem;">${m.bio || ''}</textarea>
          <div>
            <label style="display:block; font-size:.74rem; font-weight:600; margin-bottom:4px;">Foto wijzigen</label>
            <input type="file" class="row-photo musician-photo-input" accept="image/*">
          </div>
          <div class="photo-position-editor ${m.photo_url ? 'is-active' : ''}">
            <div class="photo-position-frame" data-pos-x="${m.photo_pos_x ?? 50}" data-pos-y="${m.photo_pos_y ?? 50}">
              <img src="${m.photo_url || ''}" alt="" style="object-position:${m.photo_pos_x ?? 50}% ${m.photo_pos_y ?? 50}%;">
            </div>
            <p class="photo-position-hint">Sleep de foto om het gezicht te centreren.</p>
          </div>
          <p class="row-photo-error field-error" style="display:none;"></p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-outline-dark btn-save-musician" type="button">Bewaar</button>
          <button class="btn btn-outline-dark btn-delete-musician" type="button">Verwijder</button>
        </div>
      </div>
    `).join('');

    musicianList.querySelectorAll('.photo-position-frame').forEach(attachPositionDrag);

    musicianList.querySelectorAll('.row-photo').forEach(input => {
      input.addEventListener('change', () => {
        const row = input.closest('[data-musician-id]');
        const file = input.files[0];
        if (!file) return;
        previewPhotoInEditor(row.querySelector('.photo-position-editor'), file);
      });
    });

    musicianList.querySelectorAll('.btn-save-musician').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('[data-musician-id]');
        const ageVal = row.querySelector('.row-age').value;
        const fileInput = row.querySelector('.row-photo');
        const frame = row.querySelector('.photo-position-frame');
        const errorEl = row.querySelector('.row-photo-error');
        errorEl.style.display = 'none';
        btn.disabled = true;

        const updateFields = {
          name: row.querySelector('.row-name').value,
          role: row.querySelector('.row-role').value,
          age: ageVal === '' ? null : Number(ageVal),
          bio: row.querySelector('.row-bio').value,
          rrn: row.querySelector('.row-rrn').value.trim(),
          iban: row.querySelector('.row-iban').value.trim(),
          photo_pos_x: Number(frame.dataset.posX || 50),
          photo_pos_y: Number(frame.dataset.posY || 50)
        };

        try {
          if (fileInput.files[0]) {
            updateFields.photo_url = await uploadMusicianPhoto(fileInput.files[0]);
          }
          const { error } = await sb.from('musicians').update(updateFields).eq('id', row.dataset.musicianId);
          if (error) throw error;
          showToast('Muzikant bewaard.');
          logActivity('bijgewerkt', `Muzikant: ${updateFields.name}`);
          loadMusicians();
        } catch (err) {
          errorEl.textContent = 'Bewaren mislukt: ' + (err.message || err);
          errorEl.style.display = 'block';
          showToast('Bewaren mislukt.', true);
        } finally {
          btn.disabled = false;
        }
      });
    });

    musicianList.querySelectorAll('.btn-delete-musician').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Deze muzikant verwijderen?')) return;
        const row = btn.closest('[data-musician-id]');
        const musicianName = row.querySelector('.row-name').value;
        const { error } = await sb.from('musicians').delete().eq('id', row.dataset.musicianId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Muzikant verwijderd.');
        logActivity('verwijderd', `Muzikant: ${musicianName}`);
      });
    });
  }

  // sleep-editor van het toevoegformulier
  const addPositionFrame = document.querySelector('#musician-add-position .photo-position-frame');
  if (addPositionFrame) attachPositionDrag(addPositionFrame);
  document.getElementById('musician-photo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    previewPhotoInEditor(document.getElementById('musician-add-position'), file);
  });

  document.getElementById('musician-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ageVal = document.getElementById('musician-age').value;
    const photoInput = document.getElementById('musician-photo');
    const errorEl = document.getElementById('musician-upload-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    errorEl.style.display = 'none';
    submitBtn.disabled = true;

    try {
      const { data: existing } = await sb.from('musicians').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      const nextOrder = existing && existing.length ? existing[0].sort_order + 1 : 0;

      const newMusician = {
        name: document.getElementById('musician-name').value,
        role: document.getElementById('musician-role').value,
        age: ageVal === '' ? null : Number(ageVal),
        bio: document.getElementById('musician-bio').value,
        rrn: document.getElementById('musician-rrn').value.trim(),
        iban: document.getElementById('musician-iban').value.trim(),
        sort_order: nextOrder
      };

      if (photoInput.files[0]) {
        newMusician.photo_url = await uploadMusicianPhoto(photoInput.files[0]);
        newMusician.photo_pos_x = Number(addPositionFrame.dataset.posX || 50);
        newMusician.photo_pos_y = Number(addPositionFrame.dataset.posY || 50);
      }

      const { error } = await sb.from('musicians').insert(newMusician);
      if (error) throw error;

      e.target.reset();
      document.getElementById('musician-add-position').classList.remove('is-active');
      addPositionFrame.dataset.posX = 50;
      addPositionFrame.dataset.posY = 50;
      showToast('Muzikant toegevoegd.');
      logActivity('aangemaakt', `Muzikant: ${newMusician.name}`);
      loadMusicians();
    } catch (err) {
      errorEl.textContent = 'Toevoegen mislukt: ' + (err.message || err);
      errorEl.style.display = 'block';
      showToast('Toevoegen mislukt.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* =========================================================
     FOTO'S
     ========================================================= */
  const photoGrid = document.getElementById('admin-photo-grid');

  async function loadPhotos() {
    const { data, error } = await sb.from('photos').select('*').order('sort_order', { ascending: true });
    if (error) { showToast('Kon foto\u2019s niet laden.', true); return; }
    renderPhotoGrid(data || []);
  }

  function renderPhotoGrid(photos) {
    if (!photos.length) {
      photoGrid.innerHTML = '<p class="no-results">Nog geen foto\u2019s toegevoegd.</p>';
      return;
    }
    photoGrid.innerHTML = photos.map(p => `
      <div class="admin-photo-card" data-photo-id="${p.id}">
        <img src="${p.url}" alt="${(p.caption || '').replace(/"/g, '&quot;')}">
        <div class="admin-photo-caption">${p.caption ? p.caption : '<em>Geen bijschrift</em>'}</div>
        <button class="btn btn-outline-dark btn-delete-photo" type="button">Verwijderen</button>
      </div>
    `).join('');

    photoGrid.querySelectorAll('.btn-delete-photo').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Deze foto verwijderen?')) return;
        const card = btn.closest('[data-photo-id]');
        const id = card.dataset.photoId;
        const caption = card.querySelector('.admin-photo-caption').textContent.trim();
        btn.disabled = true;
        const { error } = await sb.from('photos').delete().eq('id', id);
        if (error) { showToast('Verwijderen mislukt.', true); btn.disabled = false; return; }
        card.remove();
        showToast('Foto verwijderd.');
        logActivity('verwijderd', `Foto: ${caption}`);
      });
    });
  }

  document.getElementById('photo-upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('photo-file');
    const captionInput = document.getElementById('photo-caption');
    const errorEl = document.getElementById('photo-upload-error');
    const uploadBtn = document.getElementById('photo-upload-btn');
    errorEl.style.display = 'none';

    const file = fileInput.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Bezig met uploaden…';

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${Date.now()}-${safeName}`;

      const { error: uploadError } = await sb.storage.from('photos').upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = sb.storage.from('photos').getPublicUrl(path);

      const { data: existing } = await sb.from('photos').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      const nextOrder = existing && existing.length ? existing[0].sort_order + 1 : 0;

      const { error: insertError } = await sb.from('photos').insert({
        url: publicUrlData.publicUrl,
        caption: captionInput.value.trim(),
        sort_order: nextOrder
      });
      if (insertError) throw insertError;

      fileInput.value = '';
      const savedCaption = captionInput.value.trim();
      captionInput.value = '';
      showToast('Foto toegevoegd.');
      logActivity('aangemaakt', `Foto: ${savedCaption || file.name}`);
      loadPhotos();
    } catch (err) {
      errorEl.textContent = 'Uploaden mislukt: ' + (err.message || err);
      errorEl.style.display = 'block';
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Foto toevoegen';
    }
  });

  /* =========================================================
     MUZIEK
     ========================================================= */
  const trackList = document.getElementById('admin-track-list');

  async function loadTracks() {
    const { data, error } = await sb.from('tracks').select('*').order('sort_order', { ascending: true });
    if (error) { showToast('Kon muziek niet laden.', true); return; }
    renderTrackList(data || []);
  }

  function renderTrackList(tracks) {
    if (!tracks.length) {
      trackList.innerHTML = '<p class="no-results">Nog geen muziek toegevoegd.</p>';
      return;
    }
    trackList.innerHTML = tracks.map(t => `
      <div class="admin-list-row" data-track-id="${t.id}" style="align-items: flex-start; flex-wrap: wrap;">
        <div style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:220px;">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input type="text" class="row-title" value="${(t.title || '').replace(/"/g, '&quot;')}" placeholder="Titel" style="flex:1; min-width:160px;">
            <input type="text" class="row-meta" value="${(t.meta || '').replace(/"/g, '&quot;')}" placeholder="Omschrijving" style="flex:1; min-width:160px;">
          </div>
          <audio controls src="${t.audio_url}" style="width:100%; height:34px;"></audio>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-outline-dark btn-save-track" type="button">Bewaar</button>
          <button class="btn btn-outline-dark btn-delete-track" type="button">Verwijder</button>
        </div>
      </div>
    `).join('');

    trackList.querySelectorAll('.btn-save-track').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('[data-track-id]');
        const title = row.querySelector('.row-title').value;
        btn.disabled = true;
        const { error } = await sb.from('tracks').update({
          title: title,
          meta: row.querySelector('.row-meta').value
        }).eq('id', row.dataset.trackId);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Nummer bewaard.', Boolean(error));
        if (!error) logActivity('bijgewerkt', `Muziek: ${title}`);
      });
    });

    trackList.querySelectorAll('.btn-delete-track').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit nummer verwijderen?')) return;
        const row = btn.closest('[data-track-id]');
        const title = row.querySelector('.row-title').value;
        const { error } = await sb.from('tracks').delete().eq('id', row.dataset.trackId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Nummer verwijderd.');
        logActivity('verwijderd', `Muziek: ${title}`);
      });
    });
  }

  document.getElementById('track-upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('track-file');
    const titleInput = document.getElementById('track-title');
    const metaInput = document.getElementById('track-meta');
    const errorEl = document.getElementById('track-upload-error');
    const uploadBtn = document.getElementById('track-upload-btn');
    errorEl.style.display = 'none';

    const file = fileInput.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Bezig met uploaden…';

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${Date.now()}-${safeName}`;

      const { error: uploadError } = await sb.storage.from('audio').upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = sb.storage.from('audio').getPublicUrl(path);

      const { data: existing } = await sb.from('tracks').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      const nextOrder = existing && existing.length ? existing[0].sort_order + 1 : 0;

      const { error: insertError } = await sb.from('tracks').insert({
        title: titleInput.value.trim(),
        meta: metaInput.value.trim(),
        audio_url: publicUrlData.publicUrl,
        sort_order: nextOrder
      });
      if (insertError) throw insertError;

      const savedTitle = titleInput.value.trim();
      e.target.reset();
      showToast('Nummer toegevoegd.');
      logActivity('aangemaakt', `Muziek: ${savedTitle}`);
      loadTracks();
    } catch (err) {
      errorEl.textContent = 'Uploaden mislukt: ' + (err.message || err) + ' (bestaat de opslagruimte "audio" al?)';
      errorEl.style.display = 'block';
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Nummer toevoegen';
    }
  });

  /* =========================================================
     VIDEO'S
     ========================================================= */
  const videoList = document.getElementById('admin-video-list');
  const videoEmbedField = document.getElementById('video-embed-field');
  const videoFileField = document.getElementById('video-file-field');

  document.querySelectorAll('input[name="video-source"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isUpload = document.querySelector('input[name="video-source"]:checked').value === 'upload';
      videoEmbedField.hidden = isUpload;
      videoFileField.hidden = !isUpload;
      document.getElementById('video-url').required = !isUpload;
    });
  });

  function embedThumbHtml(v) {
    if (v.source_type === 'upload') {
      return `<video src="${v.video_url}" style="width:100%; max-height:160px; border-radius:3px;" controls></video>`;
    }
    return `<p class="field-hint" style="word-break:break-all;">${v.video_url}</p>`;
  }

  async function loadVideos() {
    const { data, error } = await sb.from('videos').select('*').order('sort_order', { ascending: true });
    if (error) { showToast('Kon video\u2019s niet laden.', true); return; }
    renderVideoList(data || []);
  }

  function renderVideoList(videos) {
    if (!videos.length) {
      videoList.innerHTML = '<p class="no-results">Nog geen video\u2019s toegevoegd.</p>';
      return;
    }
    videoList.innerHTML = videos.map(v => `
      <div class="admin-list-row" data-video-id="${v.id}" style="align-items: flex-start; flex-wrap: wrap;">
        <div style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:220px;">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input type="text" class="row-title" value="${(v.title || '').replace(/"/g, '&quot;')}" placeholder="Titel" style="flex:1; min-width:160px;">
            <input type="text" class="row-desc" value="${(v.description || '').replace(/"/g, '&quot;')}" placeholder="Omschrijving" style="flex:1; min-width:160px;">
          </div>
          <span class="field-hint">${v.source_type === 'upload' ? 'Geüpload bestand' : 'YouTube/Vimeo-link'}</span>
          ${embedThumbHtml(v)}
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-outline-dark btn-save-video" type="button">Bewaar</button>
          <button class="btn btn-outline-dark btn-delete-video" type="button">Verwijder</button>
        </div>
      </div>
    `).join('');

    videoList.querySelectorAll('.btn-save-video').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('[data-video-id]');
        const title = row.querySelector('.row-title').value;
        btn.disabled = true;
        const { error } = await sb.from('videos').update({
          title: title,
          description: row.querySelector('.row-desc').value
        }).eq('id', row.dataset.videoId);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Video bewaard.', Boolean(error));
        if (!error) logActivity('bijgewerkt', `Video: ${title}`);
      });
    });

    videoList.querySelectorAll('.btn-delete-video').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Deze video verwijderen?')) return;
        const row = btn.closest('[data-video-id]');
        const title = row.querySelector('.row-title').value;
        const { error } = await sb.from('videos').delete().eq('id', row.dataset.videoId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Video verwijderd.');
        logActivity('verwijderd', `Video: ${title}`);
      });
    });
  }

  document.getElementById('video-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sourceType = document.querySelector('input[name="video-source"]:checked').value;
    const titleInput = document.getElementById('video-title');
    const descInput = document.getElementById('video-desc');
    const urlInput = document.getElementById('video-url');
    const fileInput = document.getElementById('video-file');
    const errorEl = document.getElementById('video-upload-error');
    const submitBtn = document.getElementById('video-upload-btn');
    errorEl.style.display = 'none';

    if (sourceType === 'embed' && !urlInput.value.trim()) {
      errorEl.textContent = 'Vul een YouTube- of Vimeo-link in.';
      errorEl.style.display = 'block';
      return;
    }
    if (sourceType === 'upload' && !fileInput.files[0]) {
      errorEl.textContent = 'Kies een videobestand om te uploaden.';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Bezig…';

    try {
      let videoUrl = urlInput.value.trim();

      if (sourceType === 'upload') {
        const file = fileInput.files[0];
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const path = `${Date.now()}-${safeName}`;
        const { error: uploadError } = await sb.storage.from('videos').upload(path, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = sb.storage.from('videos').getPublicUrl(path);
        videoUrl = publicUrlData.publicUrl;
      }

      const { data: existing } = await sb.from('videos').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      const nextOrder = existing && existing.length ? existing[0].sort_order + 1 : 0;

      const { error: insertError } = await sb.from('videos').insert({
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        source_type: sourceType,
        video_url: videoUrl,
        sort_order: nextOrder
      });
      if (insertError) throw insertError;

      const savedTitle = titleInput.value.trim();
      e.target.reset();
      videoEmbedField.hidden = false;
      videoFileField.hidden = true;
      urlInput.required = true;
      showToast('Video toegevoegd.');
      logActivity('aangemaakt', `Video: ${savedTitle}`);
      loadVideos();
    } catch (err) {
      errorEl.textContent = 'Toevoegen mislukt: ' + (err.message || err) + (sourceType === 'upload' ? ' (bestaat de opslagruimte "videos" al?)' : '');
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Video toevoegen';
    }
  });

  /* =========================================================
     KALENDER
     ========================================================= */
  const gigList = document.getElementById('admin-gig-list');

  async function loadGigs() {
    const { data, error } = await sb.from('gigs').select('*').order('gig_date', { ascending: true });
    if (error) { showToast('Kon optredens niet laden.', true); return; }
    renderGigList(data || []);
  }

  function renderGigList(gigs) {
    if (!gigs.length) {
      gigList.innerHTML = '<p class="no-results">Nog geen optredens toegevoegd.</p>';
      return;
    }
    gigList.innerHTML = gigs.map(g => `
      <div class="admin-list-row" data-gig-id="${g.id}">
        <input type="date" class="row-date" value="${g.gig_date}">
        <input type="text" class="row-title" value="${(g.title || '').replace(/"/g, '&quot;')}">
        <input type="text" class="row-location" value="${(g.location || '').replace(/"/g, '&quot;')}">
        <select class="row-status">
          <option value="private" ${g.status === 'private' ? 'selected' : ''}>Besloten</option>
          <option value="open" ${g.status === 'open' ? 'selected' : ''}>Vrij toegankelijk</option>
        </select>
        <button class="btn btn-outline-dark btn-save-gig" type="button">Bewaar</button>
        <button class="btn btn-outline-dark btn-delete-gig" type="button">Verwijder</button>
      </div>
    `).join('');

    gigList.querySelectorAll('.btn-save-gig').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('[data-gig-id]');
        const id = row.dataset.gigId;
        const status = row.querySelector('.row-status').value;
        const title = row.querySelector('.row-title').value;
        btn.disabled = true;
        const { error } = await sb.from('gigs').update({
          gig_date: row.querySelector('.row-date').value,
          title: title,
          location: row.querySelector('.row-location').value,
          status,
          status_label: status === 'open' ? 'Vrij toegankelijk' : 'Besloten'
        }).eq('id', id);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Optreden bewaard.', Boolean(error));
        if (!error) logActivity('bijgewerkt', `Optreden: ${title}`);
      });
    });

    gigList.querySelectorAll('.btn-delete-gig').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit optreden verwijderen?')) return;
        const row = btn.closest('[data-gig-id]');
        const title = row.querySelector('.row-title').value;
        const { error } = await sb.from('gigs').delete().eq('id', row.dataset.gigId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Optreden verwijderd.');
        logActivity('verwijderd', `Optreden: ${title}`);
      });
    });
  }

  document.getElementById('gig-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('gig-status').value;
    const title = document.getElementById('gig-title').value;
    const { error } = await sb.from('gigs').insert({
      gig_date: document.getElementById('gig-date').value,
      title: title,
      location: document.getElementById('gig-location').value,
      status,
      status_label: status === 'open' ? 'Vrij toegankelijk' : 'Besloten'
    });
    if (error) { showToast('Toevoegen mislukt.', true); return; }
    e.target.reset();
    showToast('Optreden toegevoegd.');
    logActivity('aangemaakt', `Optreden: ${title}`);
    loadGigs();
  });

  /* =========================================================
     REPERTOIRE
     ========================================================= */
  const songList = document.getElementById('admin-song-list');
  const DECADE_LABELS = { '60s': 'Jaren 60', '70s': 'Jaren 70', '80s': 'Jaren 80', '90s': 'Jaren 90', '2000s': 'Jaren 2000', '2010s': 'Jaren 2010+' };

  async function loadSongs() {
    const { data, error } = await sb.from('songs').select('*').order('title', { ascending: true });
    if (error) { showToast('Kon repertoire niet laden.', true); return; }
    renderSongList(data || []);
  }

  function renderSongList(songs) {
    if (!songs.length) {
      songList.innerHTML = '<p class="no-results">Nog geen nummers toegevoegd.</p>';
      return;
    }
    songList.innerHTML = songs.map(s => `
      <div class="admin-list-row" data-song-id="${s.id}">
        <input type="text" class="row-title" value="${(s.title || '').replace(/"/g, '&quot;')}">
        <input type="text" class="row-artist" value="${(s.artist || '').replace(/"/g, '&quot;')}">
        <select class="row-decade">
          ${Object.entries(DECADE_LABELS).map(([val, label]) => `<option value="${val}" ${s.decade === val ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <button class="btn btn-outline-dark btn-save-song" type="button">Bewaar</button>
        <button class="btn btn-outline-dark btn-delete-song" type="button">Verwijder</button>
      </div>
    `).join('');

    songList.querySelectorAll('.btn-save-song').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('[data-song-id]');
        const title = row.querySelector('.row-title').value;
        btn.disabled = true;
        const { error } = await sb.from('songs').update({
          title: title,
          artist: row.querySelector('.row-artist').value,
          decade: row.querySelector('.row-decade').value
        }).eq('id', row.dataset.songId);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Nummer bewaard.', Boolean(error));
        if (!error) logActivity('bijgewerkt', `Nummer: ${title}`);
      });
    });

    songList.querySelectorAll('.btn-delete-song').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit nummer verwijderen?')) return;
        const row = btn.closest('[data-song-id]');
        const title = row.querySelector('.row-title').value;
        const { error } = await sb.from('songs').delete().eq('id', row.dataset.songId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Nummer verwijderd.');
        logActivity('verwijderd', `Nummer: ${title}`);
      });
    });
  }

  document.getElementById('song-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('song-title').value;
    const { error } = await sb.from('songs').insert({
      title: title,
      artist: document.getElementById('song-artist').value,
      decade: document.getElementById('song-decade').value
    });
    if (error) { showToast('Toevoegen mislukt.', true); return; }
    e.target.reset();
    document.getElementById('song-decade').value = '2010s';
    showToast('Nummer toegevoegd.');
    logActivity('aangemaakt', `Nummer: ${title}`);
    loadSongs();
  });

  /* =========================================================
     CONTRACTEN
     ========================================================= */
  const contractList = document.getElementById('admin-contract-list');
  const contractForm = document.getElementById('contract-form');
  const contractSubmitBtn = document.getElementById('contract-submit-btn');
  const contractCancelBtn = document.getElementById('contract-cancel-edit');
  const contractErrorEl = document.getElementById('contract-form-error');
  const musicianPaymentRows = document.getElementById('musician-payment-rows');
  const addMusicianPaymentBtn = document.getElementById('add-musician-payment-btn');

  const PAYMENT_METHOD_LABELS = { wita: 'Working in the Arts (AKV)', regulier: 'Reguliere vergoeding' };
  const SESSION_TYPES = ['Optreden', 'Repetitie', 'Andere'];

  let knownMusicians = [];
  sb.from('musicians').select('name, rrn, iban').then(({ data }) => {
    if (data) {
      knownMusicians = data.filter(m => m.name);
      const list = document.getElementById('known-musicians-list');
      if (list) list.innerHTML = knownMusicians.map(m => `<option value="${m.name.replace(/"/g, '&quot;')}">`).join('');
    }
  });

  /* ---------- Bedragen: parsen ("€ 81,90" -> 81.9) en formatteren ---------- */
  function parseEuroAmount(str) {
    if (!str) return 0;
    let s = String(str).replace(/[^0-9,.\-]/g, '').trim();
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }
  function formatEuroAmount(n) {
    return '€ ' + n.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function makeSessionRow(session) {
    session = session || {};
    const row = document.createElement('div');
    row.className = 'mp-session-row';
    row.innerHTML = `
      <select class="mps-type" aria-label="Type sessie">
        ${SESSION_TYPES.map(t => `<option ${session.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <input type="date" class="mps-date" value="${session.date || ''}" aria-label="Datum sessie">
      <input type="text" class="mps-amount" placeholder="Bedrag, bv. € 81,90" value="${(session.amount || '').replace(/"/g, '&quot;')}" aria-label="Bedrag">
      <input type="text" class="mps-travel" placeholder="Verplaatsing (optioneel, max. € 23,40)" value="${(session.travel || '').replace(/"/g, '&quot;')}" aria-label="Verplaatsingsvergoeding">
      <span class="mps-total">€ 0,00</span>
      <button type="button" class="btn-remove-session" aria-label="Sessie verwijderen">✕</button>
    `;
    row.querySelector('.btn-remove-session').addEventListener('click', () => {
      const block = row.closest('.musician-payment-block');
      row.remove();
      updateMusicianSubtotal(block);
    });
    const totalEl = row.querySelector('.mps-total');
    function recalcRow() {
      const total = parseEuroAmount(row.querySelector('.mps-amount').value) + parseEuroAmount(row.querySelector('.mps-travel').value);
      totalEl.textContent = formatEuroAmount(total);
      updateMusicianSubtotal(row.closest('.musician-payment-block'));
    }
    row.querySelector('.mps-amount').addEventListener('input', recalcRow);
    row.querySelector('.mps-travel').addEventListener('input', recalcRow);
    recalcRow();
    return row;
  }

  function updateMusicianSubtotal(block) {
    if (!block) return;
    let subtotal = 0;
    block.querySelectorAll('.mp-session-row').forEach(row => {
      subtotal += parseEuroAmount(row.querySelector('.mps-amount').value) + parseEuroAmount(row.querySelector('.mps-travel').value);
    });
    const subtotalEl = block.querySelector('.mp-subtotal-value');
    if (subtotalEl) subtotalEl.textContent = formatEuroAmount(subtotal);
    updateContractGrandTotal();
  }

  function updateContractGrandTotal() {
    let grandTotal = 0;
    musicianPaymentRows.querySelectorAll('.musician-payment-block').forEach(block => {
      block.querySelectorAll('.mp-session-row').forEach(row => {
        grandTotal += parseEuroAmount(row.querySelector('.mps-amount').value) + parseEuroAmount(row.querySelector('.mps-travel').value);
      });
    });
    const grandTotalEl = document.getElementById('mp-grand-total');
    if (grandTotalEl) grandTotalEl.textContent = formatEuroAmount(grandTotal);
    const feeInput = document.getElementById('c-fee-amount');
    if (feeInput && grandTotal > 0) feeInput.value = formatEuroAmount(grandTotal);
  }

  function makeMusicianPaymentBlock(musician) {
    musician = musician || {};
    const block = document.createElement('div');
    block.className = 'musician-payment-block';
    block.innerHTML = `
      <div class="admin-form-grid">
        <div class="field"><label>Naam</label><input type="text" class="mp-name" list="known-musicians-list" value="${(musician.name || '').replace(/"/g, '&quot;')}"></div>
        <div class="field"><label>Rijksregisternummer</label><input type="text" class="mp-rrn" placeholder="XX.XX.XX-XXX.XX" value="${(musician.rrn || '').replace(/"/g, '&quot;')}"></div>
        <div class="field"><label>Rekeningnummer (IBAN)</label><input type="text" class="mp-iban" placeholder="BE00 0000 0000 0000" value="${(musician.iban || '').replace(/"/g, '&quot;')}"></div>
        <div class="field">
          <label>Betaalwijze</label>
          <select class="mp-method">
            ${Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => `<option value="${val}" ${musician.method === val ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
      </div>
      <p class="field-hint mp-sessions-label">Sessies (optreden, en eventueel een aparte repetitie op een andere datum) — <strong>elke sessie hieronder moet apart via workinginthearts.be geregistreerd worden.</strong></p>
      <div class="mp-sessions"></div>
      <p class="mp-subtotal">Subtotaal deze muzikant: <span class="mp-subtotal-value">€ 0,00</span></p>
      <div class="mp-block-actions">
        <button type="button" class="btn btn-outline-dark btn-add-session">+ Sessie toevoegen</button>
        <button type="button" class="btn btn-outline-dark btn-remove-musician">Muzikant verwijderen</button>
      </div>
    `;
    const sessionsContainer = block.querySelector('.mp-sessions');
    const sessions = (musician.sessions && musician.sessions.length) ? musician.sessions : [{ type: 'Optreden' }];
    sessions.forEach(s => sessionsContainer.appendChild(makeSessionRow(s)));

    block.querySelector('.btn-add-session').addEventListener('click', () => {
      sessionsContainer.appendChild(makeSessionRow({ type: 'Repetitie' }));
    });
    block.querySelector('.btn-remove-musician').addEventListener('click', () => {
      block.remove();
      updateContractGrandTotal();
    });

    // Automatisch rijksregisternummer + IBAN invullen zodra een bekende muzikant gekozen wordt
    const nameInput = block.querySelector('.mp-name');
    nameInput.addEventListener('input', () => {
      const match = knownMusicians.find(m => m.name.trim().toLowerCase() === nameInput.value.trim().toLowerCase());
      if (match) {
        block.querySelector('.mp-rrn').value = match.rrn || '';
        block.querySelector('.mp-iban').value = match.iban || '';
      }
    });

    updateMusicianSubtotal(block);
    return block;
  }

  addMusicianPaymentBtn.addEventListener('click', () => {
    musicianPaymentRows.appendChild(makeMusicianPaymentBlock());
  });

  function serializeMusicianPayments() {
    return Array.from(musicianPaymentRows.querySelectorAll('.musician-payment-block')).map(block => ({
      name: block.querySelector('.mp-name').value.trim(),
      rrn: block.querySelector('.mp-rrn').value.trim(),
      iban: block.querySelector('.mp-iban').value.trim(),
      method: block.querySelector('.mp-method').value,
      sessions: Array.from(block.querySelectorAll('.mp-session-row')).map(row => ({
        type: row.querySelector('.mps-type').value,
        date: row.querySelector('.mps-date').value,
        amount: row.querySelector('.mps-amount').value.trim(),
        travel: row.querySelector('.mps-travel').value.trim()
      })).filter(s => s.date || s.amount)
    })).filter(m => m.name || m.sessions.length);
  }

  function populateMusicianPayments(list) {
    musicianPaymentRows.innerHTML = '';
    (list || []).forEach(m => musicianPaymentRows.appendChild(makeMusicianPaymentBlock(m)));
  }

  const CONTRACT_FIELD_MAP = {
    organizer_name: 'c-organizer-name',
    organizer_company: 'c-organizer-company',
    organizer_email: 'c-organizer-email',
    organizer_phone: 'c-organizer-phone',
    organizer_address: 'c-organizer-address',
    organizer_vat: 'c-organizer-vat',
    event_type: 'c-event-type',
    event_date: 'c-event-date',
    event_start_time: 'c-event-start',
    event_end_time: 'c-event-end',
    venue_name: 'c-venue-name',
    guest_count: 'c-guest-count',
    venue_address: 'c-venue-address',
    technical_notes: 'c-technical-notes',
    repertoire_notes: 'c-repertoire-notes',
    fee_amount: 'c-fee-amount',
    vat_note: 'c-vat-note',
    deposit_amount: 'c-deposit-amount',
    deposit_due: 'c-deposit-due',
    balance_due: 'c-balance-due',
    status: 'c-status',
    internal_notes: 'c-internal-notes'
  };
  const STATUS_LABELS = { concept: 'Concept', verzonden: 'Verzonden', ondertekend: 'Ondertekend', geannuleerd: 'Geannuleerd' };

  function getContractText(key) {
    const field = document.querySelector(`[data-text-key="${key}"] .text-input`);
    return field ? field.value.trim() : '';
  }

  function resetContractForm() {
    contractForm.reset();
    document.getElementById('contract-id').value = '';
    document.getElementById('c-image-rights').checked = true;
    document.getElementById('c-status').value = 'concept';
    musicianPaymentRows.innerHTML = '';
    musicianPaymentRows.appendChild(makeMusicianPaymentBlock());
    contractSubmitBtn.textContent = 'Contract opslaan';
    contractCancelBtn.hidden = true;
  }
  resetContractForm();

  contractCancelBtn.addEventListener('click', resetContractForm);

  async function loadContracts() {
    const { data, error } = await sb.from('contracts').select('*').order('event_date', { ascending: true, nullsFirst: false });
    if (error) { showToast('Kon contracten niet laden.', true); return; }
    renderContractList(data || []);
  }

  function formatContractDate(dateStr) {
    if (!dateStr) return 'geen datum ingesteld';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function summarizeMusicianPayments(list) {
    if (!list || !list.length) return '';
    return list.map(m => {
      const total = (m.sessions || []).filter(s => s.amount).map(s => s.amount).join(' + ');
      return `${m.name || 'Muzikant'}${total ? ': ' + total : ''}`;
    }).join(' · ');
  }

  function renderContractList(contracts) {
    if (!contracts.length) {
      contractList.innerHTML = '<p class="no-results">Nog geen contracten aangemaakt.</p>';
      return;
    }
    contractList.innerHTML = contracts.map(c => `
      <div class="contract-card" data-contract-id="${c.id}">
        <div class="contract-card-main">
          <span class="contract-status-badge ${c.status}">${STATUS_LABELS[c.status] || c.status}</span>
          <h4>${(c.organizer_company || c.organizer_name || 'Naamloos').replace(/</g, '&lt;')}</h4>
          <div class="contract-meta">${c.event_type || 'Type onbekend'} — ${formatContractDate(c.event_date)}${c.venue_name ? ' — ' + c.venue_name : ''}</div>
          <div class="contract-fee">${summarizeMusicianPayments(c.musician_payments)}</div>
        </div>
        <div class="contract-card-actions">
          <select class="contract-status-select" aria-label="Status wijzigen">
            ${Object.entries(STATUS_LABELS).map(([val, label]) => `<option value="${val}" ${c.status === val ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <button class="btn btn-outline-dark btn-edit-contract" type="button">Bewerken</button>
          <button class="btn btn-outline-dark btn-print-contract" type="button">Print / PDF</button>
          <button class="btn btn-outline-dark btn-email-contract" type="button">E-mailen</button>
          <button class="btn btn-outline-dark btn-delete-contract" type="button">Verwijder</button>
        </div>
      </div>
    `).join('');

    contractList.querySelectorAll('.contract-status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const card = sel.closest('[data-contract-id]');
        const { error } = await sb.from('contracts').update({ status: sel.value, updated_at: new Date().toISOString() }).eq('id', card.dataset.contractId);
        if (error) { showToast('Status bijwerken mislukt.', true); return; }
        const badge = card.querySelector('.contract-status-badge');
        badge.className = 'contract-status-badge ' + sel.value;
        badge.textContent = STATUS_LABELS[sel.value];
        showToast('Status bijgewerkt.');
        const contract = contracts.find(c => c.id === card.dataset.contractId);
        const contractLabel = contract ? (contract.organizer_name || contract.organizer_company || 'naamloos') : card.dataset.contractId;
        logActivity('status gewijzigd', `Contract: ${contractLabel} → ${STATUS_LABELS[sel.value]}`);
      });
    });

    contractList.querySelectorAll('.btn-edit-contract').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('[data-contract-id]').dataset.contractId;
        const contract = contracts.find(c => c.id === id);
        if (!contract) return;
        document.getElementById('contract-id').value = contract.id;
        Object.entries(CONTRACT_FIELD_MAP).forEach(([field, elId]) => {
          const el = document.getElementById(elId);
          if (el) el.value = contract[field] ?? '';
        });
        document.getElementById('c-image-rights').checked = contract.image_rights !== false;
        populateMusicianPayments(contract.musician_payments || []);
        if (!contract.musician_payments || !contract.musician_payments.length) {
          musicianPaymentRows.appendChild(makeMusicianPaymentBlock());
        }
        contractSubmitBtn.textContent = 'Contract bijwerken';
        contractCancelBtn.hidden = false;
        contractForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    contractList.querySelectorAll('.btn-delete-contract').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit contract definitief verwijderen?')) return;
        const id = btn.closest('[data-contract-id]').dataset.contractId;
        const contract = contracts.find(c => c.id === id);
        const contractLabel = contract ? (contract.organizer_name || contract.organizer_company || 'naamloos') : id;
        const { error } = await sb.from('contracts').delete().eq('id', id);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        showToast('Contract verwijderd.');
        logActivity('verwijderd', `Contract: ${contractLabel}`);
        loadContracts();
      });
    });

    contractList.querySelectorAll('.btn-print-contract').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('[data-contract-id]').dataset.contractId;
        const contract = contracts.find(c => c.id === id);
        if (contract) openContractPrintView(contract);
      });
    });

    contractList.querySelectorAll('.btn-email-contract').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('[data-contract-id]').dataset.contractId;
        const contract = contracts.find(c => c.id === id);
        if (contract) emailContract(contract);
      });
    });
  }

  contractForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    contractErrorEl.style.display = 'none';
    contractSubmitBtn.disabled = true;

    const payload = {};
    Object.entries(CONTRACT_FIELD_MAP).forEach(([field, elId]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if (field === 'guest_count') {
        payload[field] = el.value === '' ? null : Number(el.value);
      } else if (field === 'event_date') {
        payload[field] = el.value || null;
      } else {
        payload[field] = el.value;
      }
    });
    payload.image_rights = document.getElementById('c-image-rights').checked;
    payload.musician_payments = serializeMusicianPayments();
    payload.uses_wita = payload.musician_payments.some(m => m.method === 'wita');
    payload.updated_at = new Date().toISOString();

    const existingId = document.getElementById('contract-id').value;

    try {
      let error;
      if (existingId) {
        ({ error } = await sb.from('contracts').update(payload).eq('id', existingId));
      } else {
        ({ error } = await sb.from('contracts').insert(payload));
      }
      if (error) throw error;
      showToast(existingId ? 'Contract bijgewerkt.' : 'Contract opgeslagen.');
      logActivity(existingId ? 'bijgewerkt' : 'aangemaakt', `Contract: ${payload.organizer_name || payload.organizer_company || 'naamloos'}`);
      resetContractForm();
      loadContracts();
    } catch (err) {
      contractErrorEl.textContent = 'Opslaan mislukt: ' + (err.message || err);
      contractErrorEl.style.display = 'block';
    } finally {
      contractSubmitBtn.disabled = false;
    }
  });

  /* ---------- Print / opslaan als PDF ---------- */
  function openContractPrintView(c) {
    const companyName = getContractText('contract_company_name') || 'Nikita Unbound';
    const companyAddress = getContractText('contract_company_address');
    const iban = getContractText('contract_bank_iban');
    const vatDefault = getContractText('contract_vat_default');
    const cancellationPolicy = getContractText('contract_cancellation_policy');
    const imageRightsText = getContractText('contract_image_rights_text');
    const footerNote = getContractText('contract_footer_note');
    const witaInstructions = getContractText('contract_wita_instructions');
    const logoUrl = window.location.origin + '/assets/logo.jpg';

    const esc = (s) => (s || '').toString().replace(/</g, '&lt;');
    const row = (label, value) => value ? `<tr><th>${label}</th><td>${esc(value)}</td></tr>` : '';

    const musicianPayments = c.musician_payments || [];
    let contractGrandTotal = 0;
    const musicianRows = musicianPayments.map(m => {
      const rowsForMusician = (m.sessions || []).map(s => {
        const sessionTotal = parseEuroAmount(s.amount) + parseEuroAmount(s.travel);
        contractGrandTotal += sessionTotal;
        return `<tr>
          <td style="font-weight:600;">${esc(m.name)}</td>
          <td>${esc(m.rrn)}</td>
          <td>${esc(m.iban)}</td>
          <td>${PAYMENT_METHOD_LABELS[m.method] || esc(m.method)}</td>
          <td style="white-space:nowrap;">${esc(s.type || 'Sessie')}${s.date ? ' — ' + formatContractDate(s.date) : ''}</td>
          <td style="white-space:nowrap;">${esc(s.amount || '—')}</td>
          <td style="white-space:nowrap;">${s.travel ? esc(s.travel) : '—'}</td>
          <td style="font-weight:600; white-space:nowrap;">${formatEuroAmount(sessionTotal)}</td>
        </tr>`;
      });
      // Muzikant zonder sessies (zou niet mogen voorkomen, maar toon voor de zekerheid toch de identiteitsgegevens)
      if (!rowsForMusician.length) {
        return `<tr>
          <td style="font-weight:600;">${esc(m.name)}</td>
          <td>${esc(m.rrn)}</td>
          <td>${esc(m.iban)}</td>
          <td>${PAYMENT_METHOD_LABELS[m.method] || esc(m.method)}</td>
          <td colspan="4" style="color:#999;">Geen sessies ingevuld</td>
        </tr>`;
      }
      return rowsForMusician.join('');
    }).join('');

    const win = window.open('', '_blank');
    if (!win) { showToast('Kon printvenster niet openen (pop-up geblokkeerd?).', true); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><title>Contract — ${esc(c.organizer_company || c.organizer_name)}</title>
<style>
  body{ font-family: Georgia, 'Times New Roman', serif; color:#1a1a1a; max-width:820px; margin:40px auto; padding:0 20px; line-height:1.55; }
  .doc-header{ display:flex; align-items:center; gap:18px; border-bottom:3px solid #10203A; padding-bottom:18px; margin-bottom:6px; }
  .doc-header img{ height:56px; width:auto; border-radius:4px; }
  .doc-header h1{ font-size:1.5rem; margin:0; color:#10203A; }
  .doc-header .subtitle{ font-size:.8rem; letter-spacing:.14em; text-transform:uppercase; color:#B08D57; margin-top:2px; }
  h2{ font-size:1.02rem; margin:28px 0 10px; color:#10203A; text-transform:uppercase; letter-spacing:.04em; border-bottom: 1px solid #e2ddd3; padding-bottom:6px; }
  .parties{ display:flex; justify-content:space-between; gap:30px; margin:22px 0 10px; font-size:.92rem; }
  .parties div{ flex:1; }
  table{ width:100%; border-collapse:collapse; font-size:.9rem; }
  th{ text-align:left; width:200px; padding:6px 10px 6px 0; vertical-align:top; color:#444; font-weight:600; }
  td{ padding:6px 0; vertical-align:top; }
  .musician-table{ margin-top:6px; font-size:.82rem; }
  .musician-table th, .musician-table td{ border-bottom:1px solid #eee; padding:6px 8px; width:auto; font-weight:400; }
  .musician-table th{ color:#666; font-size:.7rem; text-transform:uppercase; letter-spacing:.03em; }
  .clause{ font-size:.87rem; color:#333; margin-top:8px; white-space:pre-line; }
  .wita-box{ background:#f7f4ee; border:1px solid #e2ddd3; border-radius:6px; padding:16px 18px; font-size:.85rem; margin-top:10px; white-space:pre-line; }
  .sign-row{ display:flex; justify-content:space-between; gap:60px; margin-top:60px; }
  .sign-box{ flex:1; }
  .sign-line{ border-top:1px solid #333; margin-top:60px; padding-top:6px; font-size:.82rem; }
  .footnote{ margin-top:50px; font-size:.76rem; color:#777; border-top:1px solid #ddd; padding-top:14px; }
  @media print{ .no-print{ display:none; } body{ margin:0 auto; } }
  .no-print{ text-align:center; margin-bottom:30px; }
  .no-print button{ font-size:1rem; padding:10px 22px; cursor:pointer; }
</style></head>
<body>
  <div class="no-print"><button onclick="window.print()">Afdrukken / opslaan als PDF</button></div>

  <div class="doc-header">
    <img src="${logoUrl}" alt="${esc(companyName)}" onerror="this.style.display='none'">
    <div>
      <h1>Overeenkomst voor optreden</h1>
      <div class="subtitle">${esc(companyName)}</div>
    </div>
  </div>
  <p style="font-size:.85rem; color:#666; margin-top:14px;">Opgesteld op ${new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

  <div class="parties">
    <div><strong>Uitvoerder</strong><br>${esc(companyName)}${companyAddress ? '<br>' + esc(companyAddress) : ''}</div>
    <div><strong>Opdrachtgever</strong><br>${esc(c.organizer_company || c.organizer_name)}${c.organizer_company ? '<br>t.a.v. ' + esc(c.organizer_name) : ''}${c.organizer_address ? '<br>' + esc(c.organizer_address) : ''}</div>
  </div>

  <h2>Gegevens optreden</h2>
  <table>
    ${row('Type gelegenheid', c.event_type)}
    ${row('Datum', c.event_date ? formatContractDate(c.event_date) : '')}
    ${row('Aanvangsuur', c.event_start_time)}
    ${row('Einduur', c.event_end_time)}
    ${row('Locatie', c.venue_name)}
    ${row('Adres locatie', c.venue_address)}
    ${row('Aantal gasten', c.guest_count)}
    ${row('Technische bijzonderheden', c.technical_notes)}
    ${row('Repertoire / opmerkingen', c.repertoire_notes)}
  </table>

  ${musicianRows ? `
  <h2>Muzikanten &amp; vergoeding</h2>
  <table class="musician-table">
    <thead><tr><th>Naam</th><th>Rijksreg.nr.</th><th>Rekeningnr.</th><th>Betaalwijze</th><th>Sessie</th><th>Bedrag</th><th>Vervoer</th><th>Totaal</th></tr></thead>
    <tbody>${musicianRows}</tbody>
    <tfoot><tr><td colspan="7" style="text-align:right; font-weight:600; padding-top:12px; border-top:2px solid #10203A;">Totaal (incl. verplaatsingskosten)</td><td style="font-weight:700; padding-top:12px; border-top:2px solid #10203A; white-space:nowrap;">${formatEuroAmount(contractGrandTotal)}</td></tr></tfoot>
  </table>
  ` : ''}

  <h2>Betalingsvoorwaarden</h2>
  <table>
    ${row('Totale vergoeding', c.fee_amount)}
    ${row('BTW', c.vat_note || vatDefault)}
    ${row('Voorschot', c.deposit_amount)}
    ${row('Voorschot te betalen voor', c.deposit_due)}
    ${row('Saldo te betalen voor', c.balance_due)}
    ${row('Rekeningnummer (algemeen)', iban)}
  </table>

  ${c.uses_wita && witaInstructions ? `<h2>Registratie via Working in the Arts</h2><div class="wita-box">${esc(witaInstructions)}</div>` : ''}

  <h2>Contactgegevens opdrachtgever</h2>
  <table>
    ${row('E-mail', c.organizer_email)}
    ${row('Telefoon', c.organizer_phone)}
    ${row('Ondernemingsnummer', c.organizer_vat)}
  </table>

  ${cancellationPolicy ? `<h2>Annuleringsvoorwaarden</h2><p class="clause">${esc(cancellationPolicy)}</p>` : ''}
  ${c.image_rights && imageRightsText ? `<h2>Beeldmateriaal</h2><p class="clause">${esc(imageRightsText)}</p>` : ''}

  <div class="sign-row">
    <div class="sign-box"><div class="sign-line">Voor akkoord — ${esc(companyName)}<br>Datum: ____________________</div></div>
    <div class="sign-box"><div class="sign-line">Voor akkoord — ${esc(c.organizer_company || c.organizer_name)}<br>Datum: ____________________</div></div>
  </div>

  ${footerNote ? `<div class="footnote">${esc(footerNote)}</div>` : ''}
</body></html>`);
    win.document.close();
  }

  /* ---------- E-mailen naar organisator ---------- */
  function emailContract(c) {
    if (!c.organizer_email) { showToast('Geen e-mailadres bij dit contract.', true); return; }
    const companyName = getContractText('contract_company_name') || 'Nikita Unbound';
    const subject = `Contract optreden ${companyName} — ${c.event_date ? formatContractDate(c.event_date) : ''}`;
    const bodyLines = [
      `Beste ${c.organizer_name || ''},`,
      '',
      `Hierbij de afspraken voor het optreden van ${companyName}:`,
      '',
      `Type gelegenheid: ${c.event_type || '-'}`,
      `Datum: ${c.event_date ? formatContractDate(c.event_date) : '-'}`,
      `Aanvangsuur: ${c.event_start_time || '-'}${c.event_end_time ? ' tot ' + c.event_end_time : ''}`,
      `Locatie: ${c.venue_name || '-'}${c.venue_address ? ', ' + c.venue_address : ''}`,
      `Gage: ${c.fee_amount || '-'}`,
      c.deposit_amount ? `Voorschot: ${c.deposit_amount}${c.deposit_due ? ' (te betalen voor ' + c.deposit_due + ')' : ''}` : '',
      '',
      'Het volledige contract vind je in bijlage (voeg het toegevoegde/afgedrukte PDF-bestand hier manueel toe).',
      '',
      'Met vriendelijke groeten,',
      companyName
    ].filter(line => line !== '').join('\n');

    const mailto = `mailto:${encodeURIComponent(c.organizer_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;
    window.location.href = mailto;
  }

});
