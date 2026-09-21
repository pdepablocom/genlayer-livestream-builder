// Builders Weekly Call: the Live text column on the left, a numbered agenda on the right,
// and the hosts along the bottom. With no hosts the agenda runs the full height.

const BUILDERS_LAYOUT = {
  title: { w: 714, maxLines: 4 },
  list: { x: 912, y: 96, w: 1872, steps: [72, 64, 56, 48] },
  // Row heights divide the space exactly: six rows margin to margin, or five above the hosts.
  rows: { withHosts: { max: 5, h: 214 }, alone: { max: 6, h: 238 } },
  host: { w: 200, h: 250, gap: 40, step: 936, name: [48, 44, 40], role: [30, 28, 26] },
  maxSpeakers: 2,
};

function renderBuildersHost(speaker, index) {
  const H = BUILDERS_LAYOUT.host;
  const host = el('div', 'bw-host', {
    style: { left: px(BUILDERS_LAYOUT.list.x + index * H.step), bottom: px(ARTBOARD.margin), gap: px(H.gap) },
  });
  const portrait = el('div', 'ab-portrait', { style: { width: px(H.w), height: px(H.h) } });
  portrait.dataset.speaker = index;
  portrait.dataset.intro = 'portrait';
  portrait.dataset.introIndex = index;
  if (speaker.photo) {
    const r = photoRect(speaker.photo, H.w, H.h);
    portrait.append(
      el('img', '', {
        src: speaker.photo.src,
        alt: '',
        draggable: false,
        style: { width: px(r.w), height: px(r.h), left: px(r.left), top: px(r.top) },
      })
    );
  } else {
    portrait.append(el('div', 'ab-hint', { text: 'Photo' }));
  }

  const textW = H.step - H.w - H.gap - 48;
  const caption = el('div', 'bw-host-text');
  caption.dataset.intro = 'caption';
  caption.dataset.introIndex = index;
  const name = el('p', 'ab-name' + (speaker.name ? '' : ' ab-placeholder'), { text: speaker.name || 'Host' });
  Object.assign(name.dataset, { fit: 'width', steps: H.name.join(','), max: textW });
  const roleLines = [speaker.role, speaker.company ? `[${speaker.company}]` : ''].filter(Boolean);
  const role = el('p', 'ab-mono ab-role', { text: roleLines.join('\n'), style: { whiteSpace: 'pre' } });
  Object.assign(role.dataset, { fit: 'width', steps: H.role.join(','), max: textW });
  caption.append(name, role);
  host.append(portrait, caption);
  return host;
}

function renderBuildersWeekly(state) {
  const L = BUILDERS_LAYOUT;
  const hosts = Math.min(state.count, L.maxSpeakers);
  const rows = hosts ? L.rows.withHosts : L.rows.alone;

  const column = el('div', 'ab-column', {
    style: { left: px(COLUMN.x), top: px(COLUMN.y), width: px(L.title.w), height: px(COLUMN.h) },
  });
  const logotype = svgNode(GL_LOGOTYPE_SVG);
  logotype.dataset.intro = 'logo';
  const title = el('p', 'ab-title');
  fillTitle(title, state.title, state);
  Object.assign(title.dataset, { intro: 'title', fit: 'lines', steps: TITLE_STEPS.join(','), max: L.title.w, maxLines: L.title.maxLines });
  const head = el('div', 'ab-head');
  head.append(logotype, title);
  if (state.subtitle.trim()) {
    const subtitle = el('p', 'ab-mono ab-subtitle', { text: state.subtitle });
    subtitle.dataset.intro = 'subtitle';
    head.append(subtitle);
  }
  const foot = el('div', 'ab-foot is-stacked');
  foot.append(renderPill(state.date));
  const handles = renderHandles(state, true);
  if (handles) foot.append(handles);
  column.append(head, foot);

  const items = state.agenda.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, rows.max);
  const list = el('div', 'ab-agenda', { style: { left: px(L.list.x), top: px(L.list.y), width: px(L.list.w) } });
  (items.length ? items : ['First topic', 'Second topic', 'Third topic']).forEach((item, i) => {
    const row = el('div', 'ab-agenda-row' + (items.length ? '' : ' ab-placeholder'), { style: { height: px(rows.h) } });
    row.dataset.intro = 'caption';
    row.dataset.introIndex = i + 2;
    const text = el('p', 'ab-name', { text: item });
    Object.assign(text.dataset, { fit: 'width', steps: L.list.steps.join(','), max: L.list.w - 200 });
    row.append(el('span', 'ab-mono ab-agenda-index', { text: String(i + 1).padStart(2, '0') }), text);
    list.append(row);
  });

  const nodes = [column, list];
  for (let i = 0; i < hosts; i++) nodes.push(renderBuildersHost(state.speakers[i], i));
  return nodes;
}

registerTemplate({
  id: 'builders-weekly',
  name: 'Builders Weekly Call',
  theme: 'live',
  sections: ['subtitle', 'agenda', 'speakers', 'stream'],
  minSpeakers: 0,
  maxSpeakers: BUILDERS_LAYOUT.maxSpeakers,
  speakerLabel: 'Host',
  portraitFrame: () => ({ w: BUILDERS_LAYOUT.host.w, h: BUILDERS_LAYOUT.host.h }),
  render: renderBuildersWeekly,
});
