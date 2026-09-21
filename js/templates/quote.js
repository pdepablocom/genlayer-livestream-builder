// Quote: one speaker and something they said. Portrait and caption sit exactly where the
// 1-speaker layout puts them; the quote takes the title's place.
// Designed for this tool on the "GL - Live" system (no Figma frame behind it).

const QUOTE_LAYOUT = {
  card: SPEAKER_LAYOUTS[1],
  column: { w: 1856 },
  quote: { steps: [128, 112, 96, 80, 64], maxLines: 7 },
};

function renderQuote(state) {
  const L = QUOTE_LAYOUT;
  const column = el('div', 'ab-column', {
    style: { left: px(COLUMN.x), top: px(COLUMN.y), width: px(L.column.w), height: px(COLUMN.h) },
  });

  const logotype = svgNode(GL_LOGOTYPE_SVG);
  logotype.dataset.intro = 'logo';
  const kicker = el('p', 'ab-mono ab-subtitle', { text: state.title.replace(/\s*\n\s*/g, ' ') });
  kicker.dataset.intro = 'subtitle';

  const text = state.quote.trim().replace(/^["“”]+|["“”]+$/g, '');
  const quote = el('p', 'ab-title ab-quote', { text: text ? `“${text}”` : '“What they said.”' });
  if (!text) quote.classList.add('ab-placeholder');
  quote.dataset.intro = 'title';
  quote.dataset.fit = 'lines';
  quote.dataset.steps = L.quote.steps.join(',');
  quote.dataset.max = L.column.w;
  quote.dataset.maxLines = L.quote.maxLines;

  const head = el('div', 'ab-head');
  head.append(logotype, kicker, quote);

  const foot = el('div', 'ab-foot');
  foot.append(renderPill(state.date));
  column.append(head, foot);

  const nodes = [column, renderCard(state.speakers[0], 0, L.card)];
  const handles = renderHandles(state, true);
  if (handles) {
    handles.classList.add('ab-corner');
    nodes.push(handles);
  }
  return nodes;
}

registerTemplate({
  id: 'quote',
  name: 'Quote',
  theme: 'live',
  sections: ['quote', 'speakers', 'stream'],
  maxSpeakers: 1,
  portraitFrame: () => ({ w: QUOTE_LAYOUT.card.card.w, h: QUOTE_LAYOUT.card.card.portraitH }),
  render: renderQuote,
});
