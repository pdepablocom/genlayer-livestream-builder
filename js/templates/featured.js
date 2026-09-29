// Main speaker + co-speakers. Speaker 1 is the headliner: name column on the left, a large portrait
// beside it. Everyone else stacks down the right as rows. A single-line title band runs along the
// bottom (as on the 4-up cover), with an optional black label above it ("KBW Panel") so the kind of
// event reads at first glance. Designed for this tool on the "GL - Live" system (no Figma frame).

const FEATURED_LAYOUT = {
  top: { y: 96, h: 900 },
  main: { textW: 620, gap: 48, portraitW: 972, nameSteps: [128, 112, 96, 88, 80], roleSteps: [40, 36, 32] },
  // The co-speaker stack fills the top zone exactly, whatever the count.
  rows: { x: 1784, w: 1000, gap: 24, nameSteps: [64, 56, 48, 44], roleSteps: [36, 32, 28], pad: 56, minTextW: 560 },
  band: { y: 1044, h: 480 },
  maxSpeakers: 5,
};

function featuredRows(count) {
  const L = FEATURED_LAYOUT;
  const n = Math.max(1, count - 1);
  const h = (L.top.h - L.rows.gap * (n - 1)) / n;
  // Landscape 5:4 photos, but the name panel always keeps at least minTextW.
  return { n, h, portraitW: Math.min(Math.round(h * 1.25), L.rows.w - L.rows.minTextW) };
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

  // Headliner.
  const lead = state.speakers[0];
  const leadText = el('div', 'ft-lead', {
    style: { left: px(ARTBOARD.margin), top: px(L.top.y), width: px(L.main.textW), height: px(L.top.h) },
  });
  leadText.dataset.intro = 'caption';
  const leadName = el('p', 'ab-name ft-lead-name' + (lead.name ? '' : ' ab-placeholder'), { text: lead.name || 'Main speaker' });
  Object.assign(leadName.dataset, { fit: 'lines', steps: L.main.nameSteps.join(','), max: L.main.textW, maxLines: 2 });
  leadText.append(leadName, featuredRole(lead, L.main.roleSteps, L.main.textW));
  const leadPortrait = featuredPortrait(lead, 0, L.main.portraitW, L.top.h);
  Object.assign(leadPortrait.style, {
    position: 'absolute',
    left: px(ARTBOARD.margin + L.main.textW + L.main.gap),
    top: px(L.top.y),
  });
  nodes.push(leadText, leadPortrait);

  // Co-speakers.
  const R = featuredRows(state.count);
  for (let i = 1; i <= R.n; i++) {
    const speaker = state.speakers[i];
    const row = el('div', 'ft-row', {
      style: { left: px(L.rows.x), top: px(L.top.y + (i - 1) * (R.h + L.rows.gap)), width: px(L.rows.w), height: px(R.h) },
    });
    const text = el('div', 'ft-row-text', { style: { padding: `0 ${px(L.rows.pad)}` } });
    text.dataset.intro = 'caption';
    text.dataset.introIndex = i;
    const textW = L.rows.w - R.portraitW - L.rows.pad * 2;
    const name = el('p', 'ab-name' + (speaker.name ? '' : ' ab-placeholder'), { text: speaker.name || 'Name' });
    Object.assign(name.dataset, { fit: 'width', steps: L.rows.nameSteps.join(','), max: textW });
    text.append(name, featuredRole(speaker, L.rows.roleSteps, textW));
    row.append(featuredPortrait(speaker, i, R.portraitW, R.h), text);
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
  sections: ['tag', 'subtitle', 'speakers', 'stream'],
  minSpeakers: 2,
  speakerLegend: (i) => (i ? `Co-speaker ${i}` : 'Main speaker'),
  maxSpeakers: FEATURED_LAYOUT.maxSpeakers,
  portraitFrame: (state, index) =>
    index ? { w: featuredRows(state.count).portraitW, h: featuredRows(state.count).h } : { w: FEATURED_LAYOUT.main.portraitW, h: FEATURED_LAYOUT.top.h },
  render: renderFeatured,
});
