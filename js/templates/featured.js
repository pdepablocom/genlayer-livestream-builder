// Main speaker + co-speakers. Every speaker is a picture with the name beside it, on the picture's
// bottom edge: the headliner's large portrait from the left margin, the event logo (first Logos slot)
// at the top of the headliner's name column, then the co-speakers as square photos filling the same
// height. A single-line title band runs along the bottom with an optional black label ("KBW Panel").
// Designed for this tool on the "GL - Live" system.

const FEATURED_LAYOUT = {
  // Every picture runs from the top margin to the same bottom edge.
  top: { y: 96, h: 926 },
  logo: { h: 88, maxW: 620 },
  // Portrait from the left margin, then the name column (event logo on top, name at the bottom).
  main: { portraitW: 972, gap: 48, textW: 620, nameSteps: [128, 112, 96, 88, 80], roleSteps: [40, 36, 32] },
  // The co-speaker stack fills the top zone exactly, whatever the count.
  rows: { x: 1784, w: 1000, gap: 24, textGap: 48, nameSteps: [64, 56, 48, 44], roleSteps: [36, 32, 28], minTextW: 560 },
  band: { y: 1078, h: 446 },
  maxSpeakers: 5,
};

const FEATURED_TEXT_X = ARTBOARD.margin + FEATURED_LAYOUT.main.portraitW + FEATURED_LAYOUT.main.gap;

function featuredRows(state) {
  const L = FEATURED_LAYOUT;
  const n = Math.max(1, state.count - 1);
  const h = (L.top.h - L.rows.gap * (n - 1)) / n;
  // Square photos, but the name always keeps at least minTextW beside them.
  return { n, h, size: Math.min(h, L.rows.w - L.rows.minTextW) };
}

function featuredPortrait(speaker, index, w, h) {
  const portrait = el('div', 'ab-portrait', { style: { width: px(w), height: px(h) } });
  portrait.dataset.speaker = index;
  portrait.dataset.intro = 'portrait';
  portrait.dataset.introIndex = index;
  if (speaker.photo) {
    const r = photoRect(speaker.photo, w, h);
    portrait.append(
      el('img', '', {
        src: speaker.photo.src,
        alt: '',
        draggable: false,
        style: { width: px(r.w), height: px(r.h), left: px(r.left), top: px(r.top) },
      })
    );
  } else {
    portrait.append(el('div', 'ab-hint', { text: 'Add a photo' }));
  }
  return portrait;
}

function featuredRole(speaker, steps, max) {
  const lines = [speaker.role, speaker.company ? `[${speaker.company}]` : ''].filter(Boolean);
  const role = el('p', 'ab-mono ab-role', { text: lines.join('\n'), style: { whiteSpace: 'pre' } });
  Object.assign(role.dataset, { fit: 'width', steps: steps.join(','), max });
  return role;
}

function renderFeatured(state) {
  const L = FEATURED_LAYOUT;
  const nodes = [];
  const top = L.top;

  const eventLogo = state.logos[0];
  if (eventLogo.src) {
    const logo = el('img', 'ft-logo', {
      src: eventLogo.black ? eventLogo.srcBlack : eventLogo.src,
      alt: '',
      style: { left: px(FEATURED_TEXT_X), top: px(L.top.y), height: px(L.logo.h), maxWidth: px(L.logo.maxW) },
    });
    logo.dataset.intro = 'art';
    nodes.push(logo);
  }

  // Headliner.
  const lead = state.speakers[0];
  const leadText = el('div', 'ft-lead', {
    style: { left: px(FEATURED_TEXT_X), top: px(top.y), width: px(L.main.textW), height: px(top.h) },
  });
  leadText.dataset.intro = 'caption';
  const leadName = el('p', 'ab-name ft-lead-name' + (lead.name ? '' : ' ab-placeholder'), { text: lead.name || 'Main speaker' });
  Object.assign(leadName.dataset, { fit: 'lines', steps: L.main.nameSteps.join(','), max: L.main.textW, maxLines: 2 });
  leadText.append(leadName, featuredRole(lead, L.main.roleSteps, L.main.textW));
  const leadPortrait = featuredPortrait(lead, 0, L.main.portraitW, top.h);
  Object.assign(leadPortrait.style, {
    position: 'absolute',
    left: px(ARTBOARD.margin),
    top: px(top.y),
  });
  nodes.push(leadText, leadPortrait);

  // Co-speakers.
  const R = featuredRows(state);
  for (let i = 1; i <= R.n; i++) {
    const speaker = state.speakers[i];
    const row = el('div', 'ft-row', {
      style: { left: px(L.rows.x), top: px(top.y + (i - 1) * (R.h + L.rows.gap)), gap: px(L.rows.textGap) },
    });
    const text = el('div', 'ft-row-text');
    text.dataset.intro = 'caption';
    text.dataset.introIndex = i;
    const textW = L.rows.w - R.size - L.rows.textGap;
    const name = el('p', 'ab-name' + (speaker.name ? '' : ' ab-placeholder'), { text: speaker.name || 'Name' });
    Object.assign(name.dataset, { fit: 'width', steps: L.rows.nameSteps.join(','), max: textW });
    text.append(name, featuredRole(speaker, L.rows.roleSteps, textW));
    row.append(featuredPortrait(speaker, i, R.size, R.size), text);
    nodes.push(row);
  }

  // Title band.
  const band = el('div', 'ab-column', {
    style: { left: px(ARTBOARD.margin), top: px(L.band.y), width: px(ARTBOARD.w - ARTBOARD.margin * 2), height: px(L.band.h) },
  });
  const head = el('div', 'ab-head ft-head');
  if (state.tag.trim()) {
    const tag = el('div', 'ab-mono ft-tag', { text: state.tag.trim() });
    tag.dataset.intro = 'logo';
    head.append(tag);
  }
  const title = el('p', 'ab-title is-single-line');
  fillTitle(title, state.title.replace(/\s*\n\s*/g, ' '), state);
  Object.assign(title.dataset, { intro: 'title', fit: 'width', steps: TITLE_STEPS.join(','), max: ARTBOARD.w - ARTBOARD.margin * 2 });
  head.append(title);
  if (state.subtitle.trim()) {
    const subtitle = el('p', 'ab-mono ab-subtitle', { text: state.subtitle.split('\n').map((s) => s.trim()).filter(Boolean).join(', ') });
    subtitle.dataset.intro = 'subtitle';
    head.append(subtitle);
  }
  const foot = el('div', 'ab-foot');
  foot.append(renderPill(state.date));
  const handles = renderHandles(state, true);
  if (handles) foot.append(handles);
  band.append(head, foot);

  const logotype = svgNode(GL_LOGOTYPE_SVG, 'ab-corner');
  logotype.dataset.intro = 'logo';
  nodes.push(band, logotype);
  return nodes;
}

registerTemplate({
  id: 'featured',
  name: 'Main speaker',
  theme: 'live',
  sections: ['tag', 'subtitle', 'speakers', 'logos', 'stream'],
  maxLogos: 1,
  logoHint: 'The event logo, above the main speaker\'s name. SVG or transparent PNG works best.',
  minSpeakers: 2,
  speakerLegend: (i) => (i ? `Co-speaker ${i}` : 'Main speaker'),
  maxSpeakers: FEATURED_LAYOUT.maxSpeakers,
  portraitFrame: (state, index) => {
    if (index) return { w: featuredRows(state).size, h: featuredRows(state).size };
    return { w: FEATURED_LAYOUT.main.portraitW, h: FEATURED_LAYOUT.top.h };
  },
  render: renderFeatured,
});
