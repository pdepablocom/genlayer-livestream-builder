// Artboard → PNG at its native 2880×1620, optionally downsampled.

async function artboardToCanvas(artboard, pixelRatio = 1) {
  await document.fonts.ready;
  const options = {
    width: ARTBOARD.w,
    height: ARTBOARD.h,
    pixelRatio,
    backgroundColor: '#ffffff',
    fontEmbedCSS: window.GL_FONT_CSS,
    style: { transform: 'none' },
    filter: (node) => !(node.classList && (node.classList.contains('ab-hint') || node.classList.contains('ab-placeholder'))),
  };
  // Safari decodes embedded images lazily, so its first pass can come back without them.
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) await htmlToImage.toCanvas(artboard, options);
  return htmlToImage.toCanvas(artboard, options);
}

function downsample(canvas, w, h) {
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, w, h);
  return out;
}

function exportFileName(state, w) {
  const d = new Date();
  const stamp = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const title = state.title.replace(/\s+/g, ' ').replace(/[\\/:*?"<>|]/g, '').trim() || 'Livestream';
  return `${stamp} GL ${title} ${w}.png`;
}

async function exportPng(artboard, state, w) {
  let canvas = await artboardToCanvas(artboard);
  if (w !== ARTBOARD.w) canvas = downsample(canvas, w, Math.round((w * ARTBOARD.h) / ARTBOARD.w));
  downloadBlob(await new Promise((resolve) => canvas.toBlob(resolve, 'image/png')), exportFileName(state, w));
}

function downloadBlob(blob, fileName) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
