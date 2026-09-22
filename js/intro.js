// "Starts soon" intro: a seamless loop built from the current cover, encoded to MP4 in the browser.
// The cover is rendered twice (complete, and with every animated element hidden). Each animated
// element is then a rectangle cut from the complete render and revealed over the bare one, so the
// animation costs two DOM renders instead of one per frame.

const INTRO = { w: 1920, h: 1080, fps: 30, duration: 12, outStart: 10.9, outEnd: 11.7 };

// When each kind of element comes in (seconds), how long it takes, and how.
const INTRO_CUES = {
  logo: { at: 0.2, dur: 0.6, kind: 'fade' },
  title: { at: 0.4, dur: 0.7, kind: 'rise' },
  subtitle: { at: 0.75, dur: 0.6, kind: 'fade' },
  art: { at: 0.7, dur: 0.7, kind: 'fade', stagger: 0.15 },
  portrait: { at: 0.9, dur: 0.7, kind: 'wipe', stagger: 0.12 },
  caption: { at: 1.25, dur: 0.5, kind: 'fade', stagger: 0.12 },
  // Anything blue opens and closes like a shutter; blue is never shown faded.
  date: { at: 1.5, dur: 0.6, kind: 'wipeX' },
  soon: { at: 1.8, dur: 0.6, kind: 'wipeX', hasDot: true },
};

function easeOut(x) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
}

async function prepareIntro(state) {
  // Rendered off-screen inside a parked wrapper, so the node itself carries no odd positioning into the capture.
  const parking = el('div', '', { style: { position: 'fixed', left: '-99999px', top: '0' } });
  const stageNode = el('div', 'artboard');
  parking.append(stageNode);
  document.body.append(parking);
  try {
    renderArtboard(stageNode, { ...state, intro: true });
    const k = INTRO.w / ARTBOARD.w;
    const origin = stageNode.getBoundingClientRect();
    const layers = [...stageNode.querySelectorAll('[data-intro]')].map((node) => {
      const r = node.getBoundingClientRect();
      const cue = INTRO_CUES[node.dataset.intro];
      const x = Math.floor((r.left - origin.left) * k) - 2;
      const y = Math.floor((r.top - origin.top) * k) - 2;
      return {
        ...cue,
        at: cue.at + (cue.stagger || 0) * Number(node.dataset.introIndex || 0),
        x,
        y,
        w: Math.ceil(r.width * k) + 4,
        h: Math.ceil(r.height * k) + 4,
      };
    });
    const dotNode = stageNode.querySelector('.ab-dot');
    let dot = null;
    if (dotNode) {
      const r = dotNode.getBoundingClientRect();
      dot = { x: Math.floor((r.left - origin.left) * k) - 2, y: Math.floor((r.top - origin.top) * k) - 2, w: Math.ceil(r.width * k) + 4, h: Math.ceil(r.height * k) + 4 };
    }
    const full = await artboardToCanvas(stageNode, k);
    stageNode.classList.add('is-bare');
    const bare = await artboardToCanvas(stageNode, k);
    return { full, bare, layers, dot };
  } finally {
    parking.remove();
  }
}

function drawIntroFrame(ctx, scene, t) {
  const { full, bare, layers, dot } = scene;
  ctx.globalAlpha = 1;
  ctx.drawImage(bare, 0, 0);
  const out = 1 - easeOut((t - INTRO.outStart) / (INTRO.outEnd - INTRO.outStart));
  if (out <= 0) return;

  for (const layer of layers) {
    const p = easeOut((t - layer.at) / layer.dur);
    if (p <= 0) continue;
    ctx.save();
    ctx.beginPath();
    if (layer.kind === 'wipe') {
      const visible = layer.h * p * out;
      ctx.rect(layer.x, layer.y + layer.h - visible, layer.w, visible);
    } else if (layer.kind === 'wipeX') {
      ctx.rect(layer.x, layer.y, layer.w * p * out, layer.h);
    } else {
      ctx.rect(layer.x, layer.y, layer.w, layer.h);
      ctx.globalAlpha = p * out;
    }
    ctx.clip();
    // "rise" comes up from behind the lower edge of its own box, like type out of a mask.
    const dy = layer.kind === 'rise' ? (1 - p) * layer.h * 0.3 : 0;
    ctx.drawImage(full, layer.x, layer.y, layer.w, layer.h, layer.x, layer.y + dy, layer.w, layer.h);
    ctx.restore();
  }

  // The live dot blinks: solid blue, then the bare background put back over it. No halo, no faded blue.
  const soon = layers.find((layer) => layer.hasDot);
  if (dot && soon && t > soon.at + soon.dur && t < INTRO.outStart && (t - soon.at) % 1.4 > 0.9) {
    ctx.drawImage(bare, dot.x, dot.y, dot.w, dot.h, dot.x, dot.y, dot.w, dot.h);
  }
}

function introCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = INTRO.w;
  canvas.height = INTRO.h;
  return canvas;
}

async function encodeIntro(scene, onProgress) {
  const config = { codec: 'avc1.640028', width: INTRO.w, height: INTRO.h, bitrate: 10_000_000, framerate: INTRO.fps };
  if (!window.VideoEncoder || !(await VideoEncoder.isConfigSupported(config)).supported) {
    throw new Error('This browser cannot encode MP4 video. Use a recent Chrome, Edge or Safari.');
  }
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: 'avc', width: INTRO.w, height: INTRO.h, frameRate: INTRO.fps },
    fastStart: 'in-memory',
  });
  let failure = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (failure = e),
  });
  encoder.configure(config);

  const canvas = introCanvas();
  const ctx = canvas.getContext('2d');
  const total = INTRO.duration * INTRO.fps;
  for (let i = 0; i < total; i++) {
    if (failure) throw failure;
    drawIntroFrame(ctx, scene, i / INTRO.fps);
    const frame = new VideoFrame(canvas, { timestamp: (i * 1e6) / INTRO.fps, duration: 1e6 / INTRO.fps });
    encoder.encode(frame, { keyFrame: i % (INTRO.fps * 2) === 0 });
    frame.close();
    if (encoder.encodeQueueSize > 8) await new Promise((resolve) => setTimeout(resolve, 0));
    if (i % 15 === 0) onProgress(i / total);
  }
  await encoder.flush();
  muxer.finalize();
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

// Plays the same timeline over the preview. Returns a function that stops it.
function playIntro(scene, host) {
  const canvas = introCanvas();
  canvas.className = 'intro-preview';
  host.append(canvas);
  const ctx = canvas.getContext('2d');
  const started = performance.now();
  let raf;
  const tick = (now) => {
    drawIntroFrame(ctx, scene, ((now - started) / 1000) % INTRO.duration);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
