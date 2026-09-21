// Speakers, 1 to 6. Layouts for 1–4 are read from the Figma file "GL - Live";
// 5–6 extend the same system as a 3×2 grid.

function row(xs, y = 96) {
  return xs.map((x) => ({ x, y }));
}

const SPEAKER_LAYOUTS = {
  1: {
    card: { w: 640, portraitH: 750, gap: 20, nameSteps: [72, 64, 56, 48], roleSteps: [40, 36, 32] },
    cards: row([2144]),
    title: { type: 'column', w: 1218, maxLines: 4 },
  },
  2: {
    card: { w: 640, portraitH: 750, gap: 20, nameSteps: [64, 56, 48], roleSteps: [40, 36, 32] },
    cards: row([1464, 2144]),
    title: { type: 'column', w: 1218, maxLines: 4 },
  },
  3: {
    card: { w: 600, portraitH: 750, gap: 20, nameSteps: [64, 56, 48], roleSteps: [40, 36, 32] },
    cards: row([912, 1548, 2184]),
    title: { type: 'column', w: 714, maxLines: 4 },
  },
  4: {
    card: { w: 640, portraitH: 750, gap: 20, nameSteps: [72, 64, 56, 48], roleSteps: [40, 36, 32] },
    cards: row([96, 778.67, 1461.33, 2144]),
    title: { type: 'band', x: 96, y: 1122, w: 2688, h: 402, subtitleW: 2480 },
  },
  5: grid(5),
  6: grid(6),
};

function grid(count) {
  const w = 520, portraitH = 540, colGap = 36;
  // Right-aligned to the margin.
  const x0 = ARTBOARD.w - ARTBOARD.margin - (w * 3 + colGap * 2);
  const gap = 14, name = 48, role = 30;
  const rowH = portraitH + gap + name + gap + Math.ceil(role * 1.2) * 2;
  // The second row's caption lands exactly on the bottom margin.
  const rowGap = COLUMN.h - rowH * 2;
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push({ x: x0 + (i % 3) * (w + colGap), y: 96 + Math.floor(i / 3) * (rowH + rowGap) });
  }
  return {
    card: { w, portraitH, gap, nameSteps: [name, 44, 40, 36], roleSteps: [role, 28, 26] },
    grid: true,
    cards,
    // The text column runs up to the grid, stopping one image gap short of it.
    title: { type: 'column', w: x0 - colGap - COLUMN.x, maxLines: 4 },
  };
}

function renderCard(speaker, index, layout) {
  const { card } = layout;
  const pos = layout.cards[index];
  const node = el('div', 'ab-card', {
    style: { left: px(pos.x), top: px(pos.y), width: px(card.w), gap: px(card.gap) },
  });

  const portrait = el('div', 'ab-portrait', { style: { height: px(card.portraitH) } });
  portrait.dataset.speaker = index;
  portrait.dataset.intro = 'portrait';
  portrait.dataset.introIndex = index;
  if (speaker.photo) {
    const r = photoRect(speaker.photo, card.w, card.portraitH);
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

  const caption = el('div', '', {
    style: { display: 'flex', flexDirection: 'column', gap: px(card.gap), alignItems: 'flex-start', width: '100%' },
  });
  const name = el('p', 'ab-name' + (speaker.name ? '' : ' ab-placeholder'), { text: speaker.name || 'Name' });
  name.dataset.fit = 'width';
  name.dataset.steps = card.nameSteps.join(',');
  name.dataset.max = card.w;

  const roleLines = [speaker.role, speaker.company ? `[${speaker.company}]` : ''].filter(Boolean);
  const role = el('p', 'ab-mono ab-role', { text: roleLines.join('\n'), style: { whiteSpace: 'pre' } });
  role.dataset.fit = 'width';
  role.dataset.steps = card.roleSteps.join(',');
  role.dataset.max = card.w;

  caption.dataset.intro = 'caption';
  caption.dataset.introIndex = index;
  caption.append(name, role);
  node.append(portrait, caption);
  return node;
}

function renderSpeakers(state) {
  const layout = SPEAKER_LAYOUTS[state.count];
  const nodes = [];
  const t = layout.title;

  const title = el('p', 'ab-title');
  const subtitle = el('p', 'ab-mono ab-subtitle');
  const head = el('div', 'ab-head');
  title.dataset.intro = 'title';
  subtitle.dataset.intro = 'subtitle';
  head.append(title);
  if (state.subtitle.trim()) head.append(subtitle);

  let column;
  if (t.type === 'band') {
    column = el('div', 'ab-column', { style: { left: px(t.x), top: px(t.y), width: px(t.w), height: px(t.h) } });
    fillTitle(title, state.title.replace(/\s*\n\s*/g, ' '), state);
    title.classList.add('is-single-line');
    title.dataset.fit = 'width';
    title.dataset.max = t.w;
    subtitle.textContent = state.subtitle.split('\n').map((s) => s.trim()).filter(Boolean).join(', ');
    subtitle.style.maxWidth = px(t.subtitleW);
  } else {
    column = el('div', 'ab-column', {
      style: { left: px(COLUMN.x), top: px(COLUMN.y), width: px(t.w), height: px(COLUMN.h) },
    });
    fillTitle(title, state.title, state);
    title.dataset.fit = 'lines';
    title.dataset.max = t.w;
    title.dataset.maxLines = t.maxLines;
    subtitle.textContent = state.subtitle;
  }
  title.dataset.steps = TITLE_STEPS.join(',');

  // Where the stream happens: beside the date in the band, otherwise in the bottom-right corner.
  const handles = renderHandles(state, true);
  // The 3×2 grid owns that corner, so there they stack above the date.
  const foot = el('div', 'ab-foot');
  foot.append(renderPill(state.date));
  const corner = t.type !== 'band' && !layout.grid;
  if (handles && !corner) foot.append(handles);
  if (layout.grid) foot.classList.add('is-stacked');
  column.append(head, foot);
  nodes.push(column);
  if (handles && corner) {
    handles.classList.add('ab-corner');
    nodes.push(handles);
  }

  const logotype = svgNode(GL_LOGOTYPE_SVG);
  logotype.dataset.intro = 'logo';
  if (t.type === 'band') {
    logotype.classList.add('ab-corner');
    nodes.push(logotype);
  } else {
    head.prepend(logotype);
  }

  for (let i = 0; i < state.count; i++) nodes.push(renderCard(state.speakers[i], i, layout));
  return nodes;
}

registerTemplate({
  id: 'speakers',
  name: 'Speakers',
  theme: 'live',
  sections: ['subtitle', 'speakers', 'stream'],
  portraitFrame: (state) => {
    const { card } = SPEAKER_LAYOUTS[state.count];
    return { w: card.w, h: card.portraitH };
  },
  render: renderSpeakers,
});
