/* =========================================================
   NIKITA UNBOUND — script.js
   Gedeelde logica voor alle publieke pagina's:
   - mobiele navigatie
   - jaartal in footer
   - scroll-reveal animatie
   - kalender (optredens)      — Supabase, met fallback
   - repertoire (filter/keuze) — Supabase, met fallback
   - foto's (galerij)          — Supabase, met fallback
   - formulieren (validatie + bevestiging)
   ========================================================= */

/* ---------- Fallback-data (gebruikt zolang Supabase niet is
   gekoppeld, of als een tabel nog leeg is) ---------- */
const FALLBACK_GIGS = [
  { gig_date: '2026-09-12', title: 'Trouwreceptie — Familie Peeters', location: 'Kasteel ter Linden, Gent', status: 'private', status_label: 'Besloten' },
  { gig_date: '2026-09-27', title: 'Zomerterras concert', location: 'Café De Veerman, Gent', status: 'open', status_label: 'Vrij toegankelijk' },
  { gig_date: '2026-10-10', title: 'Personeelsfeest — jaarlijkse receptie', location: 'Bedrijvenpark Oost, Destelbergen', status: 'private', status_label: 'Besloten' },
  { gig_date: '2026-11-01', title: 'Tuinfeest najaarseditie', location: 'Domein Groenveld, Merelbeke', status: 'open', status_label: 'Vrij toegankelijk' }
];

const FALLBACK_SONGS = [
  { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', decade: '60s' },
  { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', decade: '60s' },
  { title: 'Ain\u2019t No Sunshine', artist: 'Bill Withers', decade: '70s' },
  { title: 'Killing Me Softly', artist: 'Roberta Flack', decade: '70s' },
  { title: 'Sweet Dreams', artist: 'Eurythmics', decade: '80s' },
  { title: 'Wicked Game', artist: 'Chris Isaak', decade: '80s' },
  { title: 'No Woman No Cry', artist: 'Bob Marley', decade: '70s' },
  { title: 'Nothing Compares 2 U', artist: 'Sinéad O\u2019Connor', decade: '90s' },
  { title: 'Ironic', artist: 'Alanis Morissette', decade: '90s' },
  { title: 'Songbird', artist: 'Fleetwood Mac', decade: '70s' },
  { title: 'Skinny Love', artist: 'Bon Iver', decade: '2010s' },
  { title: 'Someone Like You', artist: 'Adele', decade: '2010s' },
  { title: 'Budapest', artist: 'George Ezra', decade: '2010s' },
  { title: 'Riptide', artist: 'Vance Joy', decade: '2010s' },
  { title: 'Dog Days Are Over', artist: 'Florence + the Machine', decade: '2010s' },
  { title: 'Coming Home', artist: 'Leon Bridges', decade: '2010s' },
  { title: 'Cornerstone', artist: 'Arctic Monkeys', decade: '2000s' },
  { title: 'Ho Hey', artist: 'The Lumineers', decade: '2010s' },
  { title: 'Sunday Morning', artist: 'Maroon 5', decade: '2000s' },
  { title: 'Halo', artist: 'Beyoncé', decade: '2000s' }
];

const MONTHS_NL = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobiele navigatie ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mainNav.classList.remove('is-open'));
    });
  }

  /* ---------- Jaartal in footer ---------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Scroll reveal ---------- */
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 }) : null;

  function observeReveals(root = document) {
    const els = root.querySelectorAll('.reveal:not(.is-visible)');
    if (io) {
      els.forEach(el => io.observe(el));
    } else {
      els.forEach(el => el.classList.add('is-visible'));
    }
  }
  observeReveals();

  /* =========================================================
     MUZIKANTEN
     ========================================================= */
  const musiciansGrid = document.querySelector('[data-musicians-grid]');
  if (musiciansGrid) {
    loadMusicians().then(musicians => {
      if (musicians && musicians.length) renderMusicians(musicians, musiciansGrid);
      observeReveals(musiciansGrid);
    });
  }

  async function loadMusicians() {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('musicians')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data && data.length) return data;
      } catch (err) {
        console.warn('Kon muzikanten niet laden uit Supabase, gebruik standaardlijst.', err);
      }
    }
    return null; // fallback: de statische kaarten in de HTML blijven gewoon staan
  }

  function renderMusicians(musicians, container) {
    const variants = ['variant-1', 'variant-2', 'variant-3', 'variant-4'];
    container.innerHTML = musicians.map((m, i) => `
      <div class="musician-card reveal">
        <div class="musician-portrait ${variants[i % variants.length]}" aria-hidden="${m.photo_url ? 'false' : 'true'}">
          ${m.photo_url
            ? `<img src="${m.photo_url}" alt="${(m.name || '').replace(/"/g, '&quot;')}" loading="lazy" style="object-position:${m.photo_pos_x ?? 50}% ${m.photo_pos_y ?? 50}%;">`
            : (m.name || '?').charAt(0).toUpperCase()}
        </div>
        <div class="musician-body">
          <p class="musician-role">${m.role || ''}</p>
          <h3>${m.name || ''}</h3>
          ${m.age ? `<p class="musician-age">${m.age} jaar</p>` : ''}
          <p>${m.bio || ''}</p>
        </div>
      </div>
    `).join('');
  }

  /* =========================================================
     KALENDER
     ========================================================= */
  const calendarList = document.querySelector('[data-calendar-list]');
  if (calendarList) {
    loadGigs().then(gigs => renderCalendar(gigs, calendarList));
  }

  async function loadGigs() {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('gigs')
          .select('*')
          .order('gig_date', { ascending: true });
        if (!error && data && data.length) return data;
      } catch (err) {
        console.warn('Kon optredens niet laden uit Supabase, gebruik standaardlijst.', err);
      }
    }
    return FALLBACK_GIGS;
  }

  function renderCalendar(gigs, container) {
    const upcoming = gigs
      .map(g => ({ ...g, dateObj: new Date(g.gig_date + 'T00:00:00') }))
      .filter(g => g.dateObj >= new Date(new Date().toDateString()))
      .sort((a, b) => a.dateObj - b.dateObj);

    if (!upcoming.length) {
      container.innerHTML = '<p class="calendar-empty">Op dit moment staan er geen optredens gepland. Neem gerust contact op om een datum vast te leggen.</p>';
      return;
    }

    container.innerHTML = upcoming.map(g => `
      <div class="gig reveal is-visible">
        <div class="gig-date">
          <div class="day">${g.dateObj.getDate()}</div>
          <div class="month">${MONTHS_NL[g.dateObj.getMonth()]} ${g.dateObj.getFullYear()}</div>
        </div>
        <div class="gig-info">
          <h3>${g.title}</h3>
          <p class="meta">${g.location}</p>
        </div>
        <div class="gig-status ${g.status}">${g.status_label}</div>
      </div>
    `).join('');
  }

  /* =========================================================
     REPERTOIRE
     ========================================================= */
  const songTableBody = document.querySelector('[data-song-table-body]');
  const selectedSet = new Set();
  let SONGS_DATA = FALLBACK_SONGS;

  if (songTableBody) {
    loadSongs().then(songs => {
      SONGS_DATA = songs;
      renderSongs('all', '');
    });
  }

  async function loadSongs() {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('songs')
          .select('*')
          .order('title', { ascending: true });
        if (!error && data && data.length) return data;
      } catch (err) {
        console.warn('Kon repertoire niet laden uit Supabase, gebruik standaardlijst.', err);
      }
    }
    return FALLBACK_SONGS;
  }

  function renderSongs(filterDecade, query) {
    if (!songTableBody) return;
    const q = (query || '').trim().toLowerCase();
    const rows = SONGS_DATA.filter(s => {
      const matchesDecade = filterDecade === 'all' || s.decade === filterDecade;
      const matchesQuery = !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
      return matchesDecade && matchesQuery;
    });

    if (!rows.length) {
      songTableBody.innerHTML = '';
      songTableBody.closest('table').style.display = 'none';
      document.querySelector('[data-no-results]')?.removeAttribute('hidden');
      return;
    }
    songTableBody.closest('table').style.display = '';
    document.querySelector('[data-no-results]')?.setAttribute('hidden', '');

    songTableBody.innerHTML = rows.map(s => `
      <tr class="song-row ${selectedSet.has(s.title) ? 'is-selected' : ''}" data-title="${s.title}">
        <td class="select-col"><input type="checkbox" class="song-check" aria-label="Selecteer ${s.title}" ${selectedSet.has(s.title) ? 'checked' : ''}></td>
        <td><div class="song-title">${s.title}</div><div class="song-artist">${s.artist}</div></td>
        <td><span class="decade-tag">${s.decade}</span></td>
      </tr>
    `).join('');
    updateSelectionBar();
  }

  function updateSelectionBar() {
    const bar = document.querySelector('[data-selection-bar]');
    const countEl = document.querySelector('[data-selection-count]');
    const hiddenField = document.querySelector('#gekozen-nummers');
    if (countEl) countEl.textContent = selectedSet.size;
    if (bar) bar.style.display = selectedSet.size ? 'flex' : 'none';
    if (hiddenField) hiddenField.value = Array.from(selectedSet).join(', ');
  }

  if (songTableBody) {
    const chips = document.querySelectorAll('[data-decade-filter]');
    const searchInput = document.querySelector('[data-song-search]');
    let currentDecade = 'all';

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        currentDecade = chip.dataset.decadeFilter;
        renderSongs(currentDecade, searchInput ? searchInput.value : '');
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => renderSongs(currentDecade, searchInput.value));
    }

    songTableBody.addEventListener('change', (e) => {
      if (e.target.classList.contains('song-check')) {
        const row = e.target.closest('tr');
        const title = row.dataset.title;
        if (e.target.checked) {
          selectedSet.add(title);
          row.classList.add('is-selected');
        } else {
          selectedSet.delete(title);
          row.classList.remove('is-selected');
        }
        updateSelectionBar();
      }
    });
  }

  /* =========================================================
     FOTO'S — galerij + lightbox
     ========================================================= */
  const galleryGrid = document.querySelector('[data-gallery-grid]');
  const lightbox = document.querySelector('[data-lightbox]');

  function bindLightbox() {
    if (!lightbox) return;
    const lightboxImg = lightbox.querySelector('img');
    document.querySelectorAll('[data-gallery-item] img').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('is-open');
      });
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.closest('.lightbox-close')) {
        lightbox.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('is-open');
    });
  }

  if (galleryGrid) {
    bindLightbox(); // bindt de bestaande placeholder-foto's
    if (window.supabaseClient) {
      window.supabaseClient
        .from('photos')
        .select('*')
        .order('sort_order', { ascending: true })
        .then(({ data, error }) => {
          if (error || !data || !data.length) return; // fallback blijft staan
          galleryGrid.innerHTML = data.map(p => `
            <div class="g-item" data-gallery-item>
              <img src="${p.url}" alt="${(p.caption || '').replace(/"/g, '&quot;')}" loading="lazy">
            </div>
          `).join('');
          bindLightbox();
        })
        .catch(err => console.warn('Kon foto\u2019s niet laden uit Supabase, gebruik standaardgalerij.', err));
    }
  }

  /* =========================================================
     MUZIEK — opnames op de beluister-pagina
     ========================================================= */
  const tracksList = document.querySelector('[data-tracks-list]');
  if (tracksList && window.supabaseClient) {
    window.supabaseClient
      .from('tracks')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data || !data.length) return; // fallback (voorbeeldkaarten) blijft staan
        const noteIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>';
        tracksList.innerHTML = data.map(t => `
          <div class="audio-card reveal is-visible">
            <div class="audio-icon">${noteIcon}</div>
            <div>
              <h3>${t.title || ''}</h3>
              ${t.meta ? `<p class="meta">${t.meta}</p>` : ''}
              <audio controls src="${t.audio_url}"></audio>
            </div>
          </div>
        `).join('');
      })
      .catch(err => console.warn('Kon muziek niet laden uit Supabase, gebruik voorbeeldnummers.', err));
  }

  /* =========================================================
     FORMULIEREN — validatie + bevestigingsbericht
     Formulieren met [data-web3forms] worden ook écht verstuurd
     (naar het e-mailadres gekoppeld aan de Web3Forms-sleutel in
     js/web3forms-config.js). Andere formulieren tonen enkel een
     lokale bevestiging.
     ========================================================= */
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      form.querySelectorAll('[required]').forEach(field => {
        const wrapper = field.closest('.field');
        if (!wrapper) return;
        const filled = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
        wrapper.classList.toggle('has-error', !filled);
        if (!filled) valid = false;
      });

      const emailField = form.querySelector('input[type="email"]');
      if (emailField && emailField.value.trim()) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim());
        emailField.closest('.field')?.classList.toggle('has-error', !ok);
        if (!ok) valid = false;
      }

      if (!valid) {
        const firstError = form.querySelector('.has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const sendErrorEl = form.querySelector('.form-send-error');
      if (sendErrorEl) sendErrorEl.style.display = 'none';

      function finishSuccess() {
        form.classList.add('is-submitted');
        const successEl = form.parentElement.querySelector('.form-success');
        if (successEl) successEl.classList.add('is-visible');
        form.reset();
        selectedSet.clear();
        updateSelectionBar();
      }

      if (form.hasAttribute('data-web3forms') && window.WEB3FORMS_ACCESS_KEY) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalLabel = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Bezig met versturen…'; }

        try {
          const formData = new FormData(form);
          formData.append('access_key', window.WEB3FORMS_ACCESS_KEY);
          const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: formData
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.message || 'Versturen is mislukt.');
          finishSuccess();
        } catch (err) {
          console.warn('Web3Forms verzending mislukt:', err);
          if (sendErrorEl) {
            sendErrorEl.textContent = 'Versturen is helaas mislukt. Probeer het later opnieuw, of neem rechtstreeks contact op via ' + (document.querySelector('[data-key="footer_email"]')?.textContent.trim() || 'e-mail') + '.';
            sendErrorEl.style.display = 'block';
          }
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        }
        return;
      }

      // Geen Web3Forms gekoppeld (of formulier zonder [data-web3forms]):
      // toon enkel de lokale bevestiging, zoals voorheen.
      finishSuccess();
    });
  });

});
