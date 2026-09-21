// GenTalks. Same skeleton as the AMA covers (text column left, framed portraits right), with the
// show's own lockup in place of a title: a giant "Gen Talks" and the episode as a blue roman numeral.

const GENTALKS_LAYOUT = {
  maxSpeakers: 3,
  // Word size cap, numeral size relative to the word (its cap height spans both lines of the word).
  lockup: { maxSize: 330, numeralRatio: 2.27, gapRatio: 0.22 },
  // Narrower than this, the numeral drops under the word instead of sitting beside it.
  stackBelow: 1000,
};

function renderGenTalks(state) {
  const layout = SPEAKER_LAYOUTS[Math.min(Math.max(state.count, 1), GENTALKS_LAYOUT.maxSpeakers)];
  const w = layout.title.w;

  const column = el('div', 'ab-column', {
    style: { left: px(COLUMN.x), top: px(COLUMN.y), width: px(w), height: px(COLUMN.h) },
  });
  const logotype = svgNode(GL_LOGOTYPE_SVG);
  logotype.dataset.intro = 'logo';

  const lockup = el('div', 'gt-lockup' + (w < GENTALKS_LAYOUT.stackBelow ? ' is-stacked' : ''));
  lockup.dataset.intro = 'title';
  lockup.dataset.max = w;
  lockup.append(el('p', 'ab-title gt-word', { text: state.title }));
  const episode = parseInt(state.episode, 10);
  if (episode > 0 && episode < 4000) lockup.append(el('p', 'ab-title gt-numeral', { text: toRoman(episode) }));

  const head = el('div', 'ab-head gt-head');
  head.append(logotype, lockup);
  if (state.subtitle.trim()) {
    const subtitle = el('p', 'ab-mono ab-subtitle', { text: state.subtitle });
    subtitle.dataset.intro = 'subtitle';
    head.append(subtitle);
  }
  const foot = el('div', 'ab-foot');
  foot.append(renderPill(state.date));
  column.append(head, foot);

  const nodes = [column];
  const handles = renderHandles(state, true);
  if (handles) {
    handles.classList.add('ab-corner');
    nodes.push(handles);
  }
  layout.cards.forEach((_, i) => nodes.push(renderCard(state.speakers[i], i, layout)));
  return nodes;
}

// The lockup is set as large as the text column allows.
function fitGenTalks(artboard) {
  const L = GENTALKS_LAYOUT.lockup;
  const lockup = artboard.querySelector('.gt-lockup');
  const word = lockup.querySelector('.gt-word');
  const numeral = lockup.querySelector('.gt-numeral');
  const max = Number(lockup.dataset.max);
  const stacked = lockup.classList.contains('is-stacked');
  const setSize = (size) => {
    word.style.fontSize = px(size);
    lockup.style.gap = px(size * L.gapRatio);
    if (numeral) numeral.style.fontSize = px(size * (stacked ? 1 : L.numeralRatio));
  };
  setSize(100);
  setSize(Math.min(stacked ? TITLE_STEPS[0] : L.maxSize, (100 * max) / lockup.scrollWidth));
  // Stacked, the numeral becomes the hero: as wide as the column, within reason.
  if (stacked && numeral) {
    numeral.style.fontSize = '100px';
    numeral.style.fontSize = px(Math.min(420, (100 * max) / numeral.scrollWidth));
  }
}

registerTemplate({
  id: 'gentalks',
  name: 'GenTalks',
  theme: 'live',
  sections: ['subtitle', 'speakers', 'stream'],
  maxSpeakers: GENTALKS_LAYOUT.maxSpeakers,
  portraitFrame: (state) => {
    const { card } = SPEAKER_LAYOUTS[Math.min(Math.max(state.count, 1), GENTALKS_LAYOUT.maxSpeakers)];
    return { w: card.w, h: card.portraitH };
  },
  render: renderGenTalks,
  fit: fitGenTalks,
});
