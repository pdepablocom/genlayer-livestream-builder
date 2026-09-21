// Partnership / announcement card, read from the Figma frame 580:2.

const PARTNER_LAYOUT = {
  column: { x: 96, y: 96, h: 1428 },
  title: { w: 1134, steps: [128, 112, 96], maxLines: 3 },
  logos: { x: 1237, y: 96, w: 1547, h: 563, dividerX: 792, dividerW: 4, inset: 96 },
};

function renderPartner(state) {
  const L = PARTNER_LAYOUT;
  const column = el('div', 'ab-column', {
    style: { left: px(L.column.x), top: px(L.column.y), height: px(L.column.h) },
  });

  const title = el('p', 'ab-title', { style: { width: px(L.title.w) } });
  fillTitle(title, state.title, state);
  title.dataset.intro = 'title';
  title.dataset.fit = 'lines';
  title.dataset.steps = L.title.steps.join(',');
  title.dataset.max = L.title.w;
  title.dataset.maxLines = L.title.maxLines;

  const head = el('div', 'ab-head');
  head.append(title);
  const handles = renderHandles(state);
  if (handles) head.append(handles);
  column.append(renderPill(state.date, true), head);

  const mark = svgNode(GL_MARK_SVG);
  mark.dataset.intro = 'logo';
  const nodes = [column, mark];
  const logos = state.logos.filter((l) => l.src);
  const z = L.logos;
  if (logos.length === 2) {
    const leftW = z.dividerX - z.inset;
    const rightX = z.dividerX + z.inset;
    nodes.push(logoBox(logos[0], z.x, z.y, leftW, z.h, 'flex-start', 0));
    nodes.push(logoBox(logos[1], z.x + rightX, z.y, z.w - rightX, z.h, 'flex-end', 2));
    const divider = el('div', 'ab-divider', {
      style: { left: px(z.x + z.dividerX - z.dividerW / 2), top: px(z.y), width: px(z.dividerW), height: px(z.h) },
    });
    divider.dataset.intro = 'art';
    divider.dataset.introIndex = 1;
    nodes.push(divider);
  } else if (logos.length === 1) {
    nodes.push(logoBox(logos[0], z.x, z.y, z.w, z.h, 'flex-end', 0));
  }
  return nodes;
}

function logoBox(logo, x, y, w, h, justify, index) {
  const box = el('div', 'ab-logo', {
    style: { left: px(x), top: px(y), width: px(w), height: px(h), justifyContent: justify },
  });
  box.dataset.intro = 'art';
  box.dataset.introIndex = index;
  box.append(el('img', '', { src: logo.black ? logo.srcBlack : logo.src, alt: '' }));
  return box;
}

registerTemplate({
  id: 'partnership',
  name: 'Partnership',
  theme: 'live',
  sections: ['logos', 'stream'],
  render: renderPartner,
});
