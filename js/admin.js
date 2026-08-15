/* =========================================================
   NIKITA UNBOUND — admin.js
   Logica voor het beheerpaneel (admin.html).
   Vereist een gekoppeld Supabase-project (zie instructies.html).
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const configWarning = document.getElementById('config-warning');
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');

  if (!isSupabaseConfigured() || !window.supabaseClient) {
    configWarning.hidden = false;
    loginSection.querySelector('form').setAttribute('inert', '');
    loginSection.querySelector('#login-submit').disabled = true;
    return;
  }

  const sb = window.supabaseClient;

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
    document.getElementById('user-email').textContent = session.user.email;
    loadTexts();
    loadPhotos();
    loadGigs();
    loadSongs();
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
      loginError.textContent = 'Inloggen mislukt: controleer e-mailadres en wachtwoord.';
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
    });
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
        btn.disabled = true;
        const { error } = await sb.from('photos').delete().eq('id', id);
        if (error) { showToast('Verwijderen mislukt.', true); btn.disabled = false; return; }
        card.remove();
        showToast('Foto verwijderd.');
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
      captionInput.value = '';
      showToast('Foto toegevoegd.');
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
        btn.disabled = true;
        const { error } = await sb.from('gigs').update({
          gig_date: row.querySelector('.row-date').value,
          title: row.querySelector('.row-title').value,
          location: row.querySelector('.row-location').value,
          status,
          status_label: status === 'open' ? 'Vrij toegankelijk' : 'Besloten'
        }).eq('id', id);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Optreden bewaard.', Boolean(error));
      });
    });

    gigList.querySelectorAll('.btn-delete-gig').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit optreden verwijderen?')) return;
        const row = btn.closest('[data-gig-id]');
        const { error } = await sb.from('gigs').delete().eq('id', row.dataset.gigId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Optreden verwijderd.');
      });
    });
  }

  document.getElementById('gig-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('gig-status').value;
    const { error } = await sb.from('gigs').insert({
      gig_date: document.getElementById('gig-date').value,
      title: document.getElementById('gig-title').value,
      location: document.getElementById('gig-location').value,
      status,
      status_label: status === 'open' ? 'Vrij toegankelijk' : 'Besloten'
    });
    if (error) { showToast('Toevoegen mislukt.', true); return; }
    e.target.reset();
    showToast('Optreden toegevoegd.');
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
        btn.disabled = true;
        const { error } = await sb.from('songs').update({
          title: row.querySelector('.row-title').value,
          artist: row.querySelector('.row-artist').value,
          decade: row.querySelector('.row-decade').value
        }).eq('id', row.dataset.songId);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Nummer bewaard.', Boolean(error));
      });
    });

    songList.querySelectorAll('.btn-delete-song').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit nummer verwijderen?')) return;
        const row = btn.closest('[data-song-id]');
        const { error } = await sb.from('songs').delete().eq('id', row.dataset.songId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Nummer verwijderd.');
      });
    });
  }

  document.getElementById('song-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await sb.from('songs').insert({
      title: document.getElementById('song-title').value,
      artist: document.getElementById('song-artist').value,
      decade: document.getElementById('song-decade').value
    });
    if (error) { showToast('Toevoegen mislukt.', true); return; }
    e.target.reset();
    document.getElementById('song-decade').value = '2010s';
    showToast('Nummer toegevoegd.');
    loadSongs();
  });

});
