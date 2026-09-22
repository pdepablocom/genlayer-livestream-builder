// GenTalks. Same skeleton as the AMA covers (text column left, framed portraits right), with the
// show's own lockup in place of a title: a giant "Gen Talks" and the episode as a blue roman numeral.

const GENTALKS_LAYOUT = {
  maxSpeakers: 3,
  // "Gen Talks" fills the column up to wordMax; the numeral sits underneath, as wide as the column
  // allows, never larger than numeralMax. Both step down together if the column runs out of height.
  lockup: { wordMax: 360, numeralMax: 480, gapRatio: 0.18 },
};

function renderGenTalks(state) {
  const layout = SPEAKER_LAYOUTS[Math.min(Math.max(state.count, 1), GENTALKS_LAYOUT.maxSpeakers)];
  const w = layout.title.w;

  const column = el('div', 'ab-column', {
    style: { left: px(COLUMN.x), top: px(COLUMN.y), width: px(w), height: px(COLUMN.h) },
  });
  const logotype = svgNode(GL_LOGOTYPE_SVG);
  logotype.dataset.intro = 'logo';

  const lockup = el('div', 'gt-lockup');
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

// The lockup is set as large as the text column allows, in width and then in height.
function fitGenTalks(artboard) {
  const L = GENTALKS_LAYOUT.lockup;
  const column = artboard.querySelector('.ab-column');
  const head = column.querySelector('.ab-head');
  const foot = column.querySelector('.ab-foot');
  const lockup = artboard.querySelector('.gt-lockup');
  const word = lockup.querySelector('.gt-word');
  const numeral = lockup.querySelector('.gt-numeral');
  const max = Number(lockup.dataset.max);
  const room = column.clientHeight - foot.offsetHeight - 96;

  const widthFor = (node, cap) => {
    node.style.fontSize = '100px';
    return Math.min(cap, (100 * max) / node.scrollWidth);
  };
  let wordSize = widthFor(word, L.wordMax);
  let numeralSize = numeral ? widthFor(numeral, L.numeralMax) : 0;
  const apply = (k) => {
    word.style.fontSize = px(wordSize * k);
    lockup.style.gap = px(wordSize * k * L.gapRatio);
    if (numeral) numeral.style.fontSize = px(numeralSize * k);
  };
  let k = 1;
  apply(k);
  while (head.offsetHeight > room && k > 0.4) {
    k -= 0.05;
    apply(k);
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
