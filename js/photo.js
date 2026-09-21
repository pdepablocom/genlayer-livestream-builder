// Uploaded files are processed once, in the browser, into data URLs. Nothing is sent anywhere.
// Treatment is baked into pixels (not CSS filters) so the export always matches the preview.

const PHOTO_MAX_SIDE = 1600;
const LOGO_MAX_SIDE = 2000;
const INK = [7, 7, 7];

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, revoke: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    img.src = url;
  });
}

function drawScaled(img, maxSide, minSide, background) {
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  // SVGs without intrinsic size report 0; give them a generous raster size.
  if (!w || !h) {
    w = h = maxSide;
  }
  let scale = Math.min(1, maxSide / Math.max(w, h));
  if (minSide && Math.max(w, h) < minSide) scale = minSide / Math.max(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function processPortrait(file) {
  const { img, revoke } = await loadImage(file);
  // Cut-outs are flattened onto the frame colour, which is what shows behind them anyway.
  const canvas = drawScaled(img, PHOTO_MAX_SIDE, 0, `rgb(${INK})`);
  revoke();
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = data.data;
  const contrast = 1.08;
  for (let i = 0; i < p.length; i += 4) {
    const luma = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
    p[i] = p[i + 1] = p[i + 2] = (luma - 128) * contrast + 128;
  }
  ctx.putImageData(data, 0, 0);
  return { src: canvas.toDataURL('image/jpeg', 0.9), w: canvas.width, h: canvas.height, zoom: 1, ox: 0.5, oy: 0.25 };
}

async function processLogo(file) {
  const { img, revoke } = await loadImage(file);
  const canvas = drawScaled(img, LOGO_MAX_SIDE, 1200);
  revoke();
  const src = canvas.toDataURL('image/png');
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = data.data;
  // A logo on an opaque white plate has no alpha to key on: derive it from darkness instead.
  const opaque = p[3] === 255 && p[p.length - 1] === 255;
  for (let i = 0; i < p.length; i += 4) {
    if (opaque) {
      const luma = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
      p[i + 3] = 255 - luma;
    }
    p[i] = INK[0];
    p[i + 1] = INK[1];
    p[i + 2] = INK[2];
  }
  ctx.putImageData(data, 0, 0);
  return { src, srcBlack: canvas.toDataURL('image/png'), black: true, name: file.name };
}
