// Announcement: type only. One big statement and nothing else, for news that has no faces or logos.
// Designed for this tool on the "GL - Live" system (no Figma frame behind it).

const ANNOUNCEMENT_LAYOUT = {
  column: { x: 96, y: 96, w: 2688, h: 1428 },
  title: { steps: [256, 224, 192, 160, 128], maxLines: 3 },
};

function renderAnnouncement(state) {
  const L = ANNOUNCEMENT_LAYOUT;
  const column = el('div', 'ab-column', {
    style: { left: px(L.column.x), top: px(L.column.y), width: px(L.column.w), height: px(L.column.h) },
  });

  const logotype = svgNode(GL_LOGOTYPE_SVG, 'is-flush');
  logotype.dataset.intro = 'logo';

  const title = el('p', 'ab-title');
  fillTitle(title, state.title, state);
  title.dataset.intro = 'title';
  title.dataset.fit = 'lines';
  title.dataset.steps = L.title.steps.join(',');
  title.dataset.max = L.column.w;
  title.dataset.maxLines = L.title.maxLines;

  const body = el('div', 'ab-head');
  body.append(title);
  const foot = el('div', 'ab-foot is-spread');
  foot.append(renderPill(state.date));
  const handles = renderHandles(state, true);
  if (handles) foot.append(handles);

  // Logotype pinned to the top, statement and footer pinned to the bottom.
  const bottom = el('div', 'ab-stack');
  bottom.append(body, foot);
  column.append(logotype, bottom);
  return [column];
}

registerTemplate({
  id: 'announcement',
  name: 'Announcement',
  theme: 'live',
  sections: ['stream'],
  render: renderAnnouncement,
});
