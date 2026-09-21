// Agenda: the 3-speaker text column on the left, a numbered run-of-show on the right.
// Made for recurring calls. Designed for this tool on the "GL - Live" system (no Figma frame behind it).

const AGENDA_LAYOUT = {
  title: { w: 714, maxLines: 4 },
  // Six rows fill the artboard from margin to margin, so fewer rows keep the same rhythm.
  list: { x: 912, y: 96, w: 1872, maxItems: 6, rowPad: 82, steps: [72, 64, 56, 48] },
};

function renderAgenda(state) {
  const L = AGENDA_LAYOUT;
  const column = el('div', 'ab-column', {
    style: { left: px(COLUMN.x), top: px(COLUMN.y), width: px(L.title.w), height: px(COLUMN.h) },
  });

  const logotype = svgNode(GL_LOGOTYPE_SVG);
  logotype.dataset.intro = 'logo';
  const title = el('p', 'ab-title');
  fillTitle(title, state.title, state);
  title.dataset.intro = 'title';
  title.dataset.fit = 'lines';
  title.dataset.steps = TITLE_STEPS.join(',');
  title.dataset.max = L.title.w;
  title.dataset.maxLines = L.title.maxLines;

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

  const items = state.agenda.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, L.list.maxItems);
  const list = el('div', 'ab-agenda', { style: { left: px(L.list.x), top: px(L.list.y), width: px(L.list.w) } });
  (items.length ? items : ['First topic', 'Second topic', 'Third topic']).forEach((item, i) => {
    const row = el('div', 'ab-agenda-row' + (items.length ? '' : ' ab-placeholder'), {
      style: { paddingTop: px(L.list.rowPad), paddingBottom: px(L.list.rowPad) },
    });
    row.dataset.intro = 'caption';
    row.dataset.introIndex = i;
    const text = el('p', 'ab-name', { text: item });
    text.dataset.fit = 'width';
    text.dataset.steps = L.list.steps.join(',');
    text.dataset.max = L.list.w - 200;
    row.append(el('span', 'ab-mono ab-agenda-index', { text: String(i + 1).padStart(2, '0') }), text);
    list.append(row);
  });
  return [column, list];
}

registerTemplate({
  id: 'agenda',
  name: 'Agenda',
  theme: 'live',
  sections: ['subtitle', 'agenda', 'stream'],
  render: renderAgenda,
});
