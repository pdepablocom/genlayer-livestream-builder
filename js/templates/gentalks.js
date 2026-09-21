// GenTalks. Keeps the structure of the original GenTalks covers (date top centre, a giant
// "Gen Talks" + roman numeral lockup between two portraits, logotype bottom centre) rebuilt
// in the Live register: white, black-and-white framed portraits, one blue.

const GENTALKS_LAYOUT = {
  maxSpeakers: 2,
  card: { w: 600, portraitH: 750, gap: 20, nameSteps: [64, 56, 48], roleSteps: [40, 36, 32] },
  cardY: 331,
  gutter: 96,
  lockup: { maxSize: 330, numeralRatio: 2.27 },
};

function renderGenTalks(state) {
  const L = GENTALKS_LAYOUT;
  const count = Math.min(Math.max(state.count, 1), L.maxSpeakers);
  const right = ARTBOARD.w - ARTBOARD.margin - L.card.w;
  const cards = count === 2 ? [{ x: ARTBOARD.margin, y: L.cardY }, { x: right, y: L.cardY }] : [{ x: right, y: L.cardY }];
  const zoneX = count === 2 ? ARTBOARD.margin + L.card.w + L.gutter : ARTBOARD.margin;
  const zoneW = right - L.gutter - zoneX;

  const top = el('div', 'gt-row', { style: { top: px(ARTBOARD.margin), left: px(zoneX), width: px(zoneW) } });
  top.append(renderPill(state.date));

  const word = el('p', 'ab-title gt-word', { text: state.title });
  const lockup = el('div', 'gt-lockup');
  lockup.dataset.intro = 'title';
  lockup.append(word);
  const episode = parseInt(state.episode, 10);
  if (episode > 0 && episode < 4000) lockup.append(el('p', 'ab-title gt-numeral', { text: toRoman(episode) }));

  const centre = el('div', 'gt-centre', { style: { left: px(zoneX), width: px(zoneW) } });
  centre.append(lockup);
  const topic = state.subtitle.split('\n').map((s) => s.trim()).filter(Boolean).join(' ');
  if (topic) {
    const subtitle = el('p', 'ab-mono ab-subtitle gt-topic', { text: topic });
    subtitle.dataset.intro = 'subtitle';
    centre.append(subtitle);
  }

  const bottom = el('div', 'gt-row', { style: { bottom: px(ARTBOARD.margin), left: px(zoneX), width: px(zoneW) } });
  const logotype = svgNode(GL_LOGOTYPE_SVG, 'is-flush');
  logotype.dataset.intro = 'logo';
  bottom.append(logotype);

  const nodes = [top, centre, bottom];
  for (let i = 0; i < count; i++) nodes.push(renderCard(state.speakers[i], i, { card: L.card, cards }));
  if (state.intro) {
    const soon = renderHandles(state, true);
    soon.classList.add('ab-corner');
    nodes.push(soon);
  }
  return nodes;
}

// The lockup is set as large as the space between the portraits allows.
function fitGenTalks(artboard) {
  const L = GENTALKS_LAYOUT.lockup;
  const centre = artboard.querySelector('.gt-centre');
  const lockup = artboard.querySelector('.gt-lockup');
  const setSize = (size) => {
    lockup.querySelector('.gt-word').style.fontSize = px(size);
    const numeral = lockup.querySelector('.gt-numeral');
    if (numeral) numeral.style.fontSize = px(size * L.numeralRatio);
    lockup.style.gap = px(size * 0.22);
  };
  setSize(100);
  setSize(Math.min(L.maxSize, (100 * centre.clientWidth) / lockup.scrollWidth));
  // Centred on the portraits, so the lockup reads as sitting between the two people.
  const portraitCentre = GENTALKS_LAYOUT.cardY + GENTALKS_LAYOUT.card.portraitH / 2;
  centre.style.top = px(portraitCentre - lockup.offsetHeight / 2);
}

registerTemplate({
  id: 'gentalks',
  name: 'GenTalks',
  theme: 'live',
  sections: ['subtitle', 'speakers'],
  maxSpeakers: GENTALKS_LAYOUT.maxSpeakers,
  portraitFrame: () => ({ w: GENTALKS_LAYOUT.card.w, h: GENTALKS_LAYOUT.card.portraitH }),
  render: renderGenTalks,
  fit: fitGenTalks,
});
