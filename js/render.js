// Shared rendering pieces and the template registry. state → artboard DOM. The artboard is always 2880×1620; the preview only scales it with CSS.

const GL_MARK_SVG =
  '<svg class="ab-mark" viewBox="0 0 158.121 148.5" xmlns="http://www.w3.org/2000/svg" fill="#070707">' +
  '<path d="M71.5881 52.2569L44.8356 108.423L70.0192 120.99L0 148.5L71.5881 0V52.2569Z"/>' +
  '<path d="M86.5333 52.2569L113.286 108.423L88.1022 120.99L158.121 148.5L86.5333 0V52.2569Z"/>' +
  '<path d="M78.6725 70.7204L94.3456 101.671L78.6725 109.344L63.8405 101.638L78.6725 70.7204Z"/>' +
  '</svg>';

// Official logotype, from assets/gl-logotype.svg. Inlined so the export works from disk.
const GL_LOGOTYPE_SVG =
  "<svg class=\"ab-logotype\" viewBox=\"0 0 385.32 91.93\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"#070707\"><path d=\"M296.72,79.83v-6.28h7.17l2.69-6.54-13.82-31.49h8.28l9.49,22.42h.26l9.18-22.42h7.96l-13.55,31.65-5.31,12.66h-12.36Z\"/><path d=\"M106.14,46.33c0-13.83,8.72-22.96,22.42-22.96,11.51,0,19.01,6.2,19.76,15.19h-7.36c-1.29-5.38-5.31-8.45-9.2-8.45h-6.2c-6.34,0-11.99,7.15-11.99,16.08s5.79,15.94,12.54,15.94h4.57c5.04,0,8.99-3,10.63-6.2v-5.66h-10.97v-6.06h17.78v13.9c-2.73,5.31-8.86,10.77-19.62,10.77-13.56,0-22.35-8.31-22.35-22.55Z\"/><path d=\"M153.44,51.78c0-10.42,6.95-17.17,17.1-17.17,9.61,0,16.01,5.86,16.01,17.51v1.64h-25.96c.68,4.97,3.82,8.86,8.52,8.86h2.93c3.68,0,6.06-2.25,6.81-5.11h7.09c-.89,6.54-6.27,11.38-15.6,11.38-10.77,0-16.9-7.22-16.9-17.1ZM179.33,48.31c-.34-4.57-3.54-7.43-7.02-7.43h-3.75c-3.75,0-6.75,2.93-7.7,7.43h18.46Z\"/><path d=\"M191.68,34.61h17.85c8.04,0,12.74,4.57,12.74,12.95v20.37h-7.15v-19.15c0-4.7-2.38-7.49-5.79-7.49h-10.49v26.64h-7.15v-33.32Z\"/><path d=\"M228.29,24.32h7.36v36.86h16.26v6.75h-23.62V24.32Z\"/><path d=\"M253.95,51.71c0-10.08,6.54-17.1,15.88-17.1,4.84,0,8.79,2.25,10.9,4.84v-3.88h7.02v32.36h-7.02v-4.57c-2.45,3.13-6,5.52-11.11,5.52-9.4,0-15.67-7.02-15.67-17.17ZM269.15,62.48h4.29c4.02,0,7.09-3.41,7.09-7.84v-5.66c0-4.29-2.86-7.97-7.09-7.97h-4.29c-4.43,0-8.04,4.77-8.04,10.7s3.61,10.77,8.04,10.77Z\"/><path d=\"M327.94,51.78c0-10.42,6.95-17.17,17.1-17.17,9.61,0,16.01,5.86,16.01,17.51v1.64h-25.96c.68,4.97,3.82,8.86,8.52,8.86h2.93c3.68,0,6.06-2.25,6.81-5.11h7.09c-.89,6.54-6.27,11.38-15.6,11.38-10.77,0-16.9-7.22-16.9-17.1ZM353.83,48.31c-.34-4.57-3.54-7.43-7.02-7.43h-3.75c-3.75,0-6.75,2.93-7.7,7.43h18.46Z\"/><path d=\"M366.18,35.57h19.15v6.88h-11.99v25.48h-7.15v-32.36Z\"/><polygon points=\"44.26 32.35 27.72 67.12 43.29 74.9 0 91.93 44.26 0 44.26 32.35\"/><polygon points=\"53.5 32.35 70.04 67.12 54.47 74.9 97.76 91.93 53.5 0 53.5 32.35\"/><polygon points=\"48.64 43.78 58.33 62.94 48.64 67.69 39.47 62.92 48.64 43.78\"/></svg>";

function el(tag, className, props) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (props) {
    const { style, text, ...rest } = props;
    if (style) Object.assign(node.style, style);
    if (text !== undefined) node.textContent = text;
    Object.assign(node, rest);
  }
  return node;
}

function px(n) {
  return n + 'px';
}

// Geometry of a photo inside its frame: cover-fit, then zoom, then pan by focus point (0–1).
function photoRect(photo, frameW, frameH) {
  const scale = Math.max(frameW / photo.w, frameH / photo.h) * photo.zoom;
  const w = photo.w * scale;
  const h = photo.h * scale;
  return { w, h, left: (frameW - w) * photo.ox, top: (frameH - h) * photo.oy };
}


function svgNode(markup, className) {
  const holder = document.createElement('div');
  holder.innerHTML = markup;
  const node = holder.firstElementChild;
  if (className) node.classList.add(className);
  return node;
}

const GL_TEMPLATES = {};

// A template turns the shared state into artboard nodes. `sections` names the panel
// sections it uses; `portraitFrame` gives the photo frame size so reframing works in any layout.
function registerTemplate(template) {
  GL_TEMPLATES[template.id] = template;
}

function toRoman(n) {
  const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [value, glyph] of table) {
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  }
  return out;
}

// Title text, plus the blue episode numeral for numbered shows ("Builders Weekly Call XXIII").
function fillTitle(node, text, state) {
  node.textContent = text;
  const episode = parseInt(state.episode, 10);
  const show = window.GL_SHOWS.find((s) => s.id === state.show);
  if (!show || !show.episode || !(episode > 0 && episode < 4000)) return;
  node.append(' ', el('span', 'ab-episode', { text: toRoman(episode) }));
}

function renderPill(text, compact) {
  const pill = el('div', 'ab-mono ab-pill' + (compact ? ' is-compact' : ''), { text: text || 'Date' });
  pill.dataset.intro = 'date';
  return pill;
}

// In the intro, "where it streams" gives way to a generic "Starting soon" with a live dot.
function renderStartingSoon() {
  const node = el('div', 'ab-soon');
  node.dataset.intro = 'soon';
  node.append(el('i', 'ab-dot'), el('span', '', { text: 'Starting soon' }));
  return node;
}

function renderHandles(state, short) {
  if (state.intro) return renderStartingSoon();
  const handles = state.handles.map((s) => s.trim()).filter(Boolean);
  if (!handles.length) return null;
  const rowNode = el('div', 'ab-handles');
  for (const handle of handles) {
    const chip = el('div', 'ab-mono ab-handle' + (short ? ' is-short' : ''));
    chip.append(el('span', '', { text: handle }));
    rowNode.append(chip);
  }
  return rowNode;
}

function renderArtboard(artboard, state) {
  const template = GL_TEMPLATES[state.template];
  artboard.dataset.theme = template.theme;
  artboard.replaceChildren(...template.render(state));
  fitText(artboard);
  if (template.fit) template.fit(artboard);
}

// Text never free-scales: it steps down a fixed size ladder until it fits.
function fitText(root) {
  for (const node of root.querySelectorAll('[data-fit]')) {
    const steps = node.dataset.steps.split(',').map(Number);
    const max = Number(node.dataset.max);
    const maxLines = Number(node.dataset.maxLines || 0);
    const lineHeight = parseFloat(getComputedStyle(node).lineHeight) / parseFloat(getComputedStyle(node).fontSize);
    let fits = false;
    for (const size of steps) {
      node.style.fontSize = px(size);
      const tooWide = node.scrollWidth > Math.ceil(max) + 1;
      const lines = Math.round(node.offsetHeight / (size * lineHeight));
      fits = !tooWide && (node.dataset.fit !== 'lines' || lines <= maxLines);
      if (fits) break;
    }
    // Past the smallest step, names and roles wrap inside the card instead of running into the next one.
    if (!fits && node.dataset.fit === 'width' && !node.classList.contains('ab-title')) {
      node.style.whiteSpace = 'pre-line';
      node.style.width = '100%';
    }
  }
}
