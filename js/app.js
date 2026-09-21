const form = document.getElementById('form');
const artboard = document.getElementById('artboard');
const frame = document.getElementById('frame');
const stage = document.getElementById('stage');
const speakersRoot = document.getElementById('speakers');
const logosRoot = document.getElementById('logos');

let state = defaultState();
let previewScale = 1;
let saveTimer;

const missingFonts = new Set();

function update(mutate) {
  if (mutate) mutate(state);
  const limits = GL_TEMPLATES[state.template];
  state.count = Math.min(Math.max(state.count, limits.minSpeakers ?? 1), limits.maxSpeakers || MAX_SPEAKERS);
  renderArtboard(artboard, state);
  syncPanel();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set('state', state), 300);
}

function fitPreview() {
  const style = getComputedStyle(stage);
  const availW = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const availH = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  previewScale = Math.min(availW / ARTBOARD.w, availH / ARTBOARD.h);
  artboard.style.transform = `scale(${previewScale})`;
  frame.style.width = ARTBOARD.w * previewScale + 'px';
  frame.style.height = ARTBOARD.h * previewScale + 'px';
}

/* Panel */

function buildPanel() {
  form.show.append(...window.GL_SHOWS.map((show) => new Option(show.name, show.id)));
  const speakerTemplate = document.getElementById('speaker-template');
  for (let i = 0; i < MAX_SPEAKERS; i++) {
    const node = speakerTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.index = i;
    node.querySelector('legend').textContent = `Speaker ${i + 1}`;
    speakersRoot.append(node);
  }
  const logoTemplate = document.getElementById('logo-template');
  for (let i = 0; i < 2; i++) {
    const node = logoTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.index = i;
    logosRoot.append(node);
  }
}

const SHOW_FIELDS = ['title', 'subtitle', 'count', 'episode', 'agenda'];

// Remembers the outgoing show's content, then loads the incoming show's last content or its defaults.
function switchShow(id) {
  update((s) => {
    s.showMemory[s.show] = Object.fromEntries(SHOW_FIELDS.map((key) => [key, s[key]]));
    s.show = id;
    const show = window.GL_SHOWS.find((item) => item.id === id);
    s.template = show.template;
    Object.assign(s, { episode: '', subtitle: '', agenda: '' }, show.defaults, s.showMemory[id]);
  });
  fillPanel();
}

function fillPanel() {
  form.show.value = state.show;
  form.episode.value = state.episode;
  form.agenda.value = state.agenda;
  form.title.value = state.title;
  form.subtitle.value = state.subtitle;
  form.date.value = state.date;
  form.handle0.value = state.handles[0];
  form.handle1.value = state.handles[1];
  speakersRoot.querySelectorAll('.speaker').forEach((node, i) => {
    for (const input of node.querySelectorAll('[data-key]')) input.value = state.speakers[i][input.dataset.key];
  });
}

// Keeps everything that isn't a text field in step with the state. Text fields are left
// alone so typing never loses focus or caret position.
function syncPanel() {
  for (const group of document.querySelectorAll('.segmented')) {
    for (const button of group.children) {
      button.setAttribute('aria-checked', String(state[group.dataset.bind]) === button.dataset.value);
    }
  }
  const template = GL_TEMPLATES[state.template];
  const max = template.maxSpeakers || MAX_SPEAKERS;
  const min = template.minSpeakers ?? 1;
  for (const button of document.querySelector('[data-bind=count]').children) {
    button.hidden = Number(button.dataset.value) > max || Number(button.dataset.value) < min;
  }
  document.querySelector('[data-section=speakers] h2').textContent = template.speakerLabel ? template.speakerLabel + 's' : 'Speakers';
  document.getElementById('font-warning').hidden = !missingFonts.has(template.id);

  const show = window.GL_SHOWS.find((item) => item.id === state.show);
  const sections = [...GL_TEMPLATES[state.template].sections, ...(show && show.episode ? ['episode'] : [])];
  for (const node of document.querySelectorAll('[data-section]')) node.hidden = !sections.includes(node.dataset.section);

  speakersRoot.querySelectorAll('.speaker').forEach((node, i) => {
    const { photo } = state.speakers[i];
    node.hidden = i >= state.count;
    node.querySelector('.thumb').style.backgroundImage = photo ? `url(${photo.src})` : '';
    node.querySelector('.thumb').classList.toggle('has-image', Boolean(photo));
    node.querySelector('.speaker-photo-tools').hidden = !photo;
    node.querySelector('.speaker-library-tools').hidden = !(photo && state.speakers[i].name.trim());
    if (photo) node.querySelector('input[type=range]').value = photo.zoom;
  });

  document.getElementById('library-count').textContent = myPeople.length
    ? `${myPeople.length} saved in this browser. Export to share them with a colleague.`
    : 'Save a speaker to reuse them next time. Saved people stay in this browser.';
  document.getElementById('library-export').disabled = !myPeople.length;

  logosRoot.querySelectorAll('.logo-row').forEach((node, i) => {
    const logo = state.logos[i];
    node.querySelector('.thumb').style.backgroundImage = logo.src ? `url(${logo.black ? logo.srcBlack : logo.src})` : '';
    node.querySelector('.thumb').classList.toggle('has-image', Boolean(logo.src));
    node.querySelector('.logo-tools').hidden = !logo.src;
    node.querySelector('.logo-name').textContent = logo.name || '';
    node.querySelector('input[type=checkbox]').checked = Boolean(logo.black);
  });
}

async function setPortrait(index, file) {
  if (!file || !file.type.startsWith('image/')) return;
  const photo = await processPortrait(file);
  update((s) => (s.speakers[index].photo = photo));
}

async function setLogo(index, file) {
  if (!file) return;
  const logo = await processLogo(file);
  update((s) => (s.logos[index] = logo));
}

function bindPanel() {
  form.addEventListener('submit', (e) => e.preventDefault());

  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'show') switchShow(t.value);
    else if (['title', 'subtitle', 'date', 'episode', 'agenda'].includes(t.name)) update((s) => (s[t.name] = t.value));
    else if (t.name === 'handle0' || t.name === 'handle1') update((s) => (s.handles[Number(t.name.slice(-1))] = t.value));
    else if (t.dataset.key) update((s) => (s.speakers[t.closest('.speaker').dataset.index][t.dataset.key] = t.value));
    else if (t.type === 'range') update((s) => (s.speakers[t.closest('.speaker').dataset.index].photo.zoom = Number(t.value)));
    else if (t.type === 'checkbox') update((s) => (s.logos[t.closest('.logo-row').dataset.index].black = t.checked));
  });

  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type !== 'file' || t.id === 'library-file') return;
    const speaker = t.closest('.speaker');
    if (speaker) setPortrait(Number(speaker.dataset.index), t.files[0]);
    else setLogo(Number(t.closest('.logo-row').dataset.index), t.files[0]);
    t.value = '';
  });

  form.addEventListener('click', (e) => {
    const segment = e.target.closest('.segmented button');
    if (segment) {
      const key = segment.parentElement.dataset.bind;
      update((s) => (s[key] = key === 'count' ? Number(segment.dataset.value) : segment.dataset.value));
      return;
    }
    const thumb = e.target.closest('.thumb');
    if (thumb) {
      thumb.nextElementSibling.click();
      return;
    }
    const action = e.target.closest('[data-action]');
    if (action && action.dataset.action === 'save-person') {
      savePerson(state.speakers[action.closest('.speaker').dataset.index]);
      flash(action, 'Saved');
      syncPanel();
      return;
    }
    if (action && action.dataset.action === 'download-person') {
      const person = speakerToPerson(state.speakers[action.closest('.speaker').dataset.index]);
      downloadJson(person, person.id + '.json');
      return;
    }
    const remove = e.target.closest('[data-action=remove]');
    if (remove) {
      const speaker = remove.closest('.speaker');
      if (speaker) update((s) => (s.speakers[speaker.dataset.index].photo = null));
      else update((s) => (s.logos[remove.closest('.logo-row').dataset.index] = { src: '' }));
    }
  });

  document.getElementById('export-full').addEventListener('click', (e) => runExport(e.currentTarget, ARTBOARD.w));
  document.getElementById('export-hd').addEventListener('click', (e) => runExport(e.currentTarget, 1920));
  let stopIntro = null;
  const previewButton = document.getElementById('intro-preview');
  previewButton.addEventListener('click', async () => {
    if (stopIntro) {
      stopIntro();
      stopIntro = null;
      previewButton.textContent = 'Preview';
      return;
    }
    previewButton.textContent = 'Preparing…';
    stopIntro = playIntro(await prepareIntro(state), frame);
    previewButton.textContent = 'Stop';
  });
  document.getElementById('intro-download').addEventListener('click', async (e) => {
    const button = e.currentTarget;
    button.disabled = true;
    try {
      const blob = await encodeIntro(await prepareIntro(state), (p) => (button.textContent = `Encoding ${Math.round(p * 100)}%`));
      downloadBlob(blob, exportFileName(state, 'intro').replace(/\.png$/, '.mp4'));
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Download MP4';
    }
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Clear every field and photo?')) return;
    state = defaultState();
    fillPanel();
    update();
  });
}

function flash(button, text) {
  const label = button.textContent;
  button.textContent = text;
  setTimeout(() => (button.textContent = label), 1200);
}

/* Picking people by name */

const peopleMenu = { tag: '', active: 0 };

function renderPeopleMenu(speakerNode) {
  const input = speakerNode.querySelector('[data-key=name]');
  const menu = speakerNode.querySelector('.people-menu');
  const matches = searchPeople(input.value, peopleMenu.tag).slice(0, 8);
  peopleMenu.active = Math.min(peopleMenu.active, Math.max(0, matches.length - 1));

  const tags = el('div', 'people-tags');
  for (const tag of ['', ...allTags()]) {
    const chip = el('button', '', { type: 'button', text: tag || 'All' });
    chip.dataset.tag = tag;
    chip.setAttribute('aria-pressed', tag === peopleMenu.tag);
    tags.append(chip);
  }
  const options = matches.map((person, i) => {
    const option = el('button', 'people-option' + (i === peopleMenu.active ? ' is-active' : ''), { type: 'button' });
    option.dataset.person = person.id;
    option.append(el('span', '', { text: person.name }));
    if (person.mine) option.append(el('span', 'people-remove', { text: 'Remove' }));
    option.append(el('small', '', { text: [person.role, person.company].filter(Boolean).join(' · ') }));
    return option;
  });
  menu.replaceChildren(tags, ...(options.length ? options : [el('p', 'people-empty', { text: 'Nobody by that name yet.' })]));
  menu.hidden = false;
  placePeopleMenu(input, menu);
  input.setAttribute('aria-expanded', 'true');
  // The panel holds still while the menu is open; the menu scrolls on its own.
  form.style.overflowY = 'hidden';
}

// Below the field when there is room, otherwise above it. Never taller than the room it has.
function placePeopleMenu(input, menu) {
  const field = input.getBoundingClientRect();
  const panel = form.getBoundingClientRect();
  const below = panel.bottom - field.bottom - 12;
  const above = field.top - panel.top - 12;
  const openBelow = below >= 240 || below >= above;
  Object.assign(menu.style, {
    left: field.left + 'px',
    width: field.width + 'px',
    maxHeight: Math.min(380, openBelow ? below : above) + 'px',
    top: openBelow ? field.bottom + 4 + 'px' : 'auto',
    bottom: openBelow ? 'auto' : window.innerHeight - field.top + 4 + 'px',
  });
}

function closePeopleMenu(speakerNode) {
  form.style.overflowY = '';
  speakerNode.querySelector('.people-menu').hidden = true;
  speakerNode.querySelector('[data-key=name]').setAttribute('aria-expanded', 'false');
}

async function pickPerson(speakerNode, id) {
  const person = allPeople().find((p) => p.id === id);
  const photo = await loadPersonPhoto(person);
  update((s) => {
    s.speakers[speakerNode.dataset.index] = { name: person.name, role: person.role, company: person.company, photo: { ...photo } };
  });
  fillPanel();
  closePeopleMenu(speakerNode);
}

function bindPeople() {
  speakersRoot.addEventListener('focusin', (e) => {
    if (e.target.dataset.key !== 'name') return;
    peopleMenu.active = 0;
    renderPeopleMenu(e.target.closest('.speaker'));
  });
  speakersRoot.addEventListener('focusout', (e) => {
    if (e.target.dataset.key === 'name') closePeopleMenu(e.target.closest('.speaker'));
  });
  speakersRoot.addEventListener('input', (e) => {
    if (e.target.dataset.key !== 'name') return;
    peopleMenu.active = 0;
    renderPeopleMenu(e.target.closest('.speaker'));
  });
  speakersRoot.addEventListener('keydown', (e) => {
    if (e.target.dataset.key !== 'name') return;
    const speakerNode = e.target.closest('.speaker');
    const options = speakerNode.querySelectorAll('.people-option');
    if (e.key === 'Escape') closePeopleMenu(speakerNode);
    if (speakerNode.querySelector('.people-menu').hidden || !options.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      peopleMenu.active = (peopleMenu.active + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length;
      renderPeopleMenu(speakerNode);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickPerson(speakerNode, options[peopleMenu.active].dataset.person);
    }
  });
  // The menu must not steal focus from the name field, or focusout would close it mid-click.
  speakersRoot.addEventListener('mousedown', (e) => {
    const menu = e.target.closest('.people-menu');
    if (!menu) return;
    e.preventDefault();
    const speakerNode = menu.closest('.speaker');
    const chip = e.target.closest('[data-tag]');
    const option = e.target.closest('.people-option');
    if (chip) {
      peopleMenu.tag = chip.dataset.tag;
      renderPeopleMenu(speakerNode);
    } else if (e.target.closest('.people-remove')) {
      removePerson(option.dataset.person);
      renderPeopleMenu(speakerNode);
      syncPanel();
    } else if (option) {
      pickPerson(speakerNode, option.dataset.person);
    }
  });

  document.getElementById('library-export').addEventListener('click', () => downloadJson(myPeople, 'gl-livestream-people.json'));
  document.getElementById('library-import').addEventListener('click', () => document.getElementById('library-file').click());
  document.getElementById('library-file').addEventListener('change', async (e) => {
    await importPeople(e.target.files[0]);
    e.target.value = '';
    syncPanel();
  });
}

async function runExport(button, width) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Rendering…';
  try {
    await exportPng(artboard, state, width);
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

/* Reframing photos directly in the preview */

function bindPreview() {
  let drag = null;

  artboard.addEventListener('pointerdown', (e) => {
    const portrait = e.target.closest('.ab-portrait');
    if (!portrait) return;
    const index = Number(portrait.dataset.speaker);
    if (!state.speakers[index].photo) {
      speakersRoot.children[index].querySelector('input[type=file]').click();
      return;
    }
    drag = { index, x: e.clientX, y: e.clientY };
    artboard.setPointerCapture(e.pointerId);
    artboard.classList.add('is-dragging');
  });

  artboard.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const frame = GL_TEMPLATES[state.template].portraitFrame(state);
    const photo = state.speakers[drag.index].photo;
    const r = photoRect(photo, frame.w, frame.h);
    const dx = (e.clientX - drag.x) / previewScale;
    const dy = (e.clientY - drag.y) / previewScale;
    drag.x = e.clientX;
    drag.y = e.clientY;
    const slackX = frame.w - r.w;
    const slackY = frame.h - r.h;
    update(() => {
      if (slackX < 0) photo.ox = Math.min(1, Math.max(0, (r.left + dx) / slackX));
      if (slackY < 0) photo.oy = Math.min(1, Math.max(0, (r.top + dy) / slackY));
    });
  });

  const endDrag = () => {
    drag = null;
    artboard.classList.remove('is-dragging');
  };
  artboard.addEventListener('pointerup', endDrag);
  artboard.addEventListener('pointercancel', endDrag);

  artboard.addEventListener(
    'wheel',
    (e) => {
      const portrait = e.target.closest('.ab-portrait');
      if (!portrait) return;
      const photo = state.speakers[Number(portrait.dataset.speaker)].photo;
      if (!photo) return;
      e.preventDefault();
      update(() => (photo.zoom = Math.min(3, Math.max(1, photo.zoom * Math.exp(-e.deltaY * 0.002)))));
    },
    { passive: false }
  );

  artboard.addEventListener('dragover', (e) => {
    if (e.target.closest('.ab-portrait')) e.preventDefault();
  });
  artboard.addEventListener('drop', (e) => {
    const portrait = e.target.closest('.ab-portrait');
    if (!portrait) return;
    e.preventDefault();
    setPortrait(Number(portrait.dataset.speaker), e.dataTransfer.files[0]);
  });
}

async function start() {
  buildPanel();
  bindPanel();
  bindPeople();
  bindPreview();
  new ResizeObserver(fitPreview).observe(stage);
  window.addEventListener('pagehide', () => store.set('state', state));

  await store.open();
  const saved = await store.get('state');
  myPeople = (await store.get('library')) || [];
  if (saved) state = { ...defaultState(), ...saved };
  if (!window.GL_SHOWS.some((show) => show.id === state.show)) state.show = 'ama';
  state.template = window.GL_SHOWS.find((show) => show.id === state.show).template;
  fillPanel();

  // Text fitting measures real glyphs, so the first render waits for the brand fonts.
  await Promise.all([
    document.fonts.load('500 72px "F37 Lineca VF"'),
    document.fonts.load('400 40px "Suisse Int\'l Mono"'),
    document.fonts.load('400 16px "Suisse Int\'l"'),
  ]);
  // Templates set in fonts that aren't bundled: note which ones this computer can't draw.
  for (const template of Object.values(GL_TEMPLATES)) {
    for (const font of template.fonts || []) {
      const faces = await document.fonts.load(font).catch(() => []);
      if (!faces.length) missingFonts.add(template.id);
    }
  }
  fitPreview();
  update();
  document.body.classList.add('is-ready');
}

window.glBuilder = {
  getState: () => state,
  setState(next) {
    state = { ...defaultState(), ...next };
    fillPanel();
    update();
  },
};

start();
