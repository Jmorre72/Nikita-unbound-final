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
    loadMusicians();
    loadPhotos();
    loadTracks();
    loadVideos();
    loadGigs();
    loadSongs();
    loadContracts();
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
        const { error } = await sb.from('musicians').delete().eq('id', row.dataset.musicianId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Muzikant verwijderd.');
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
        btn.disabled = true;
        const { error } = await sb.from('tracks').update({
          title: row.querySelector('.row-title').value,
          meta: row.querySelector('.row-meta').value
        }).eq('id', row.dataset.trackId);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Nummer bewaard.', Boolean(error));
      });
    });

    trackList.querySelectorAll('.btn-delete-track').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit nummer verwijderen?')) return;
        const row = btn.closest('[data-track-id]');
        const { error } = await sb.from('tracks').delete().eq('id', row.dataset.trackId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Nummer verwijderd.');
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

      e.target.reset();
      showToast('Nummer toegevoegd.');
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
        btn.disabled = true;
        const { error } = await sb.from('videos').update({
          title: row.querySelector('.row-title').value,
          description: row.querySelector('.row-desc').value
        }).eq('id', row.dataset.videoId);
        btn.disabled = false;
        showToast(error ? 'Bewaren mislukt.' : 'Video bewaard.', Boolean(error));
      });
    });

    videoList.querySelectorAll('.btn-delete-video').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Deze video verwijderen?')) return;
        const row = btn.closest('[data-video-id]');
        const { error } = await sb.from('videos').delete().eq('id', row.dataset.videoId);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        row.remove();
        showToast('Video verwijderd.');
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

      e.target.reset();
      videoEmbedField.hidden = false;
      videoFileField.hidden = true;
      urlInput.required = true;
      showToast('Video toegevoegd.');
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

  /* =========================================================
     CONTRACTEN
     ========================================================= */
  const contractList = document.getElementById('admin-contract-list');
  const contractForm = document.getElementById('contract-form');
  const contractSubmitBtn = document.getElementById('contract-submit-btn');
  const contractCancelBtn = document.getElementById('contract-cancel-edit');
  const contractErrorEl = document.getElementById('contract-form-error');

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
    contractSubmitBtn.textContent = 'Contract opslaan';
    contractCancelBtn.hidden = true;
  }

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
          <div class="contract-fee">${c.fee_amount ? 'Gage: ' + c.fee_amount : ''}</div>
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
        contractSubmitBtn.textContent = 'Contract bijwerken';
        contractCancelBtn.hidden = false;
        contractForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    contractList.querySelectorAll('.btn-delete-contract').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dit contract definitief verwijderen?')) return;
        const id = btn.closest('[data-contract-id]').dataset.contractId;
        const { error } = await sb.from('contracts').delete().eq('id', id);
        if (error) { showToast('Verwijderen mislukt.', true); return; }
        showToast('Contract verwijderd.');
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

    const esc = (s) => (s || '').toString().replace(/</g, '&lt;');
    const row = (label, value) => value ? `<tr><th>${label}</th><td>${esc(value)}</td></tr>` : '';

    const win = window.open('', '_blank');
    if (!win) { showToast('Kon printvenster niet openen (pop-up geblokkeerd?).', true); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><title>Contract — ${esc(c.organizer_company || c.organizer_name)}</title>
<style>
  body{ font-family: Georgia, 'Times New Roman', serif; color:#1a1a1a; max-width:780px; margin:40px auto; padding:0 20px; line-height:1.55; }
  h1{ font-size:1.6rem; border-bottom:2px solid #10203A; padding-bottom:14px; margin-bottom:6px; }
  h2{ font-size:1.05rem; margin:30px 0 10px; color:#10203A; text-transform:uppercase; letter-spacing:.04em; }
  .parties{ display:flex; justify-content:space-between; gap:30px; margin:20px 0 10px; font-size:.92rem; }
  .parties div{ flex:1; }
  table{ width:100%; border-collapse:collapse; font-size:.92rem; }
  th{ text-align:left; width:220px; padding:6px 10px 6px 0; vertical-align:top; color:#444; font-weight:600; }
  td{ padding:6px 0; vertical-align:top; }
  .clause{ font-size:.88rem; color:#333; margin-top:8px; }
  .sign-row{ display:flex; justify-content:space-between; gap:60px; margin-top:70px; }
  .sign-box{ flex:1; }
  .sign-line{ border-top:1px solid #333; margin-top:60px; padding-top:6px; font-size:.82rem; }
  .footnote{ margin-top:50px; font-size:.76rem; color:#777; border-top:1px solid #ddd; padding-top:14px; }
  @media print{ .no-print{ display:none; } body{ margin:0 auto; } }
  .no-print{ text-align:center; margin-bottom:30px; }
  .no-print button{ font-size:1rem; padding:10px 22px; cursor:pointer; }
</style></head>
<body>
  <div class="no-print"><button onclick="window.print()">Afdrukken / opslaan als PDF</button></div>

  <h1>Overeenkomst voor optreden</h1>
  <p style="font-size:.85rem; color:#666;">Opgesteld op ${new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

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

  <h2>Vergoeding</h2>
  <table>
    ${row('Gage', c.fee_amount)}
    ${row('BTW', c.vat_note || vatDefault)}
    ${row('Voorschot', c.deposit_amount)}
    ${row('Voorschot te betalen voor', c.deposit_due)}
    ${row('Saldo te betalen voor', c.balance_due)}
    ${row('Rekeningnummer', iban)}
  </table>

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
