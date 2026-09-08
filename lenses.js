const hostedFallback = 'https://lens.snap.com/experience/a95642a2-f288-44cc-b35e-d5e01a8bac3d';
let active;

function safeLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : hostedFallback; }
  catch { return hostedFallback; }
}

async function deadline(promise, signal, message, onLateResult) {
  let timer, abort;
  let expired = false;
  const task = Promise.resolve(promise).then(value => {
    if (expired || signal.aborted) { onLateResult?.(value); throw new DOMException('Cancelled', 'AbortError'); }
    return value;
  });
  try {
    return await Promise.race([task, new Promise((_, reject) => {
      abort = () => { expired = true; reject(new DOMException('Cancelled', 'AbortError')); };
      if (signal.aborted) return abort();
      signal.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => { expired = true; reject(new Error(message)); }, 30000);
    })]);
  } finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
}

function stopCamera(message) {
  if (!active) return;
  const state = active;
  state.operation?.abort();
  state.operation = null;
  state.stream?.getTracks().forEach(track => track.stop());
  state.stream = null;
  const session = state.session;
  state.session = null;
  if (session) { try { session.pause(); } catch {} Promise.resolve(session.destroy()).catch(() => {}); }
  state.canvas.replaceChildren();
  state.placeholder.hidden = false;
  state.start.disabled = !state.config?.productionApiToken;
  state.start.textContent = 'Start camera';
  state.stop.hidden = true;
  state.sound.hidden = true;
  state.select.disabled = false;
  if (message) state.status.textContent = message;
}

function closePanel(restoreFocus = false) {
  if (!active) return;
  const { panel, trigger } = active;
  stopCamera();
  active = null;
  panel.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus && trigger.isConnected) trigger.focus();
}

async function startCamera(state) {
  if (active !== state || !state.config.productionApiToken) return;
  stopCamera();
  const operation = new AbortController();
  state.operation = operation;
  const signal = operation.signal;
  const wait = (promise, message, cleanup) => deadline(promise, signal, message, cleanup);
  state.start.disabled = true;
  state.start.textContent = 'Starting…';
  state.stop.hidden = false;
  state.select.disabled = true;
  const selected = state.config.lenses[Number(state.select.value)];
  try {
    state.status.textContent = 'Loading the camera experience…';
    const sdk = await wait(import('./assets/lenses/camera-kit.js'), 'The camera experience took too long to load. Please try again.');
    const kit = await wait(sdk.bootstrapCameraKit({ apiToken: state.config.productionApiToken }), 'Could not connect to Snapchat. Please try again.');
    const { lenses, errors } = await wait(kit.lensRepository.loadLensGroups([state.config.lensGroupId]), 'The lenses took too long to load. Please try again.');
    const lens = lenses.find(item => selected.lensId ? item.id === selected.lensId : item.name.toLowerCase() === selected.name.toLowerCase());
    if (!lens) throw new Error(errors?.length ? 'The lenses are unavailable right now. Try opening this lens on Snapchat below.' : 'This lens is not available right now. Try opening it on Snapchat below.');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot access a camera. Try a current version of Chrome or Safari.');
    state.status.textContent = 'Allow camera access to try the lens.';
    state.stream = await wait(navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false }), 'Camera access is still pending. Allow it in your browser, then try again.', stream => stream.getTracks().forEach(track => track.stop()));
    state.session = await wait(kit.createSession(), 'Could not start the camera experience.', session => { Promise.resolve(session.destroy()).catch(() => {}); });
    const session = state.session;
    session.events.addEventListener('error', event => {
      if (active !== state || state.session !== session) return;
      if (event.detail.error.name === 'LensVideoPlaybackMutedError') {
        state.sound.hidden = false;
        state.status.textContent = 'Your browser muted the sound. Click Enable sound to hear the lens.';
      } else {
        stopCamera('The lens stopped unexpectedly. Try again, or open it on Snapchat below.');
      }
    });
    state.canvas.replaceChildren(session.output.live);
    state.placeholder.hidden = true;
    await wait(session.setSource(sdk.createMediaStreamSource(state.stream, { transform: sdk.Transform2D.MirrorX, cameraType: 'front' })), 'Could not connect your camera.');
    const applied = await wait(session.applyLens(lens), 'The lens did not start. Please try again.');
    if (applied === false) throw new Error('Accept Snap’s terms to use the lens, then try again.');
    await wait(session.play(), 'Could not play this lens. Please try again.');
    state.status.textContent = `${selected.name} is ready. ${selected.description}`;
    state.start.textContent = 'Restart lens';
    state.start.disabled = false;
    state.select.disabled = false;
  } catch (error) {
    if (signal.aborted || active !== state) return;
    const messages = {
      NotAllowedError: 'Camera access was declined. Allow camera access in your browser, then try again.',
      NotFoundError: 'No camera was found. Connect a camera or try this lens on your phone.',
      NotReadableError: 'Your camera is unavailable. Close other apps using it, then try again.'
    };
    // Show friendly copy; never expose SDK diagnostics containing app credentials.
    const message = messages[error.name] || (error.message?.includes(state.config.productionApiToken) ? 'Could not start this lens. Please try again.' : error.message) || 'Could not start this lens. Please try again.';
    stopCamera(message);
  }
}

export async function toggleLensPanel(panel, trigger) {
  if (active?.panel === panel) { closePanel(true); return; }
  closePanel();
  panel.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  panel.innerHTML = `
    <div class="lens-panel-header"><p class="lens-eyebrow">A LITTLE AUGMENTED REALITY</p><button type="button" class="lens-close" aria-label="Close lens demo">×</button></div>
    <div class="lens-layout">
      <div class="lens-copy">
        <h3>Step into the lens.</h3>
        <p>Something I made. Something you can play.</p>
        <label for="featured-lens">Choose a lens</label><select id="featured-lens"></select>
        <p class="lens-description"></p>
        <div class="lens-actions"><button class="lens-primary" type="button" disabled>Start camera</button><button class="lens-stop" type="button" hidden>Stop camera</button><button class="lens-sound lens-stop" type="button" hidden>Enable sound</button></div>
        <p class="lens-status" role="status" aria-live="polite">Loading lens details…</p>
        <a class="lens-hosted" target="_blank" rel="noopener noreferrer">Open on Snapchat <span aria-hidden="true">↗</span></a>
        <p class="lens-privacy">This site does not record your camera. Snap powers the effects and processes data under its <a href="https://values.snap.com/privacy/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
      </div>
      <div class="lens-viewfinder"><div class="lens-canvas"></div><div class="lens-placeholder"><span class="lens-focus-corners" aria-hidden="true"></span><span>Your camera goes here.</span><small>Ready when you are.</small></div></div>
    </div>`;
  const state = active = {
    panel, trigger, operation: new AbortController(),
    start: panel.querySelector('.lens-primary'), stop: panel.querySelector('.lens-stop'),
    sound: panel.querySelector('.lens-sound'),
    canvas: panel.querySelector('.lens-canvas'), placeholder: panel.querySelector('.lens-placeholder'),
    select: panel.querySelector('select'), status: panel.querySelector('.lens-status'),
    hosted: panel.querySelector('.lens-hosted'), config: null
  };
  state.hosted.href = hostedFallback;
  panel.querySelector('.lens-close').addEventListener('click', () => closePanel(true));
  state.stop.addEventListener('click', () => stopCamera('Camera stopped.'));
  state.start.addEventListener('click', () => startCamera(state));
  state.sound.addEventListener('click', () => {
    if (!state.session) return;
    state.session.unmute();
    state.sound.hidden = true;
    state.status.textContent = 'Sound enabled.';
  });
  state.select.addEventListener('change', () => { stopCamera('Lens selected. Start your camera when you’re ready.'); updateSelection(); });
  function updateSelection() {
    const lens = state.config.lenses[Number(state.select.value)];
    panel.querySelector('.lens-description').textContent = lens.description;
    state.hosted.href = safeLink(lens.hostedUrl);
  }
  try {
    const response = await deadline(fetch('./content/lenses.json', { signal: state.operation.signal }), state.operation.signal, 'Lens details could not be loaded.');
    if (!response.ok) throw new Error('Lens details could not be loaded.');
    const config = await response.json();
    if (active !== state) return;
    // Only the local preview may supply a staging token. It never enters repository files.
    if (location.hostname === 'localhost') {
      try {
        const preview = JSON.parse(sessionStorage.getItem('lens-preview') || 'null');
        if (preview?.stagingApiToken) { config.productionApiToken = preview.stagingApiToken; config.lensGroupId = preview.lensGroupId || config.lensGroupId; }
      } catch {}
    }
    if (!Array.isArray(config.lenses) || !config.lenses.length) throw new Error('No featured lenses are available.');
    state.config = config;
    config.lenses.forEach((lens, i) => state.select.add(new Option(lens.name, String(i))));
    updateSelection();
    if (config.productionApiToken) {
      state.start.disabled = false;
      state.status.textContent = 'Start your camera to play right here.';
    } else {
      state.start.hidden = true;
      state.hosted.classList.add('lens-primary');
      state.hosted.firstChild.textContent = 'Try Vine Trivia on Snapchat ';
      state.status.textContent = 'Play in your browser on Snapchat’s website. No app download needed.';
      state.placeholder.querySelector('span:not([aria-hidden])').textContent = 'Finish the quote.';
      state.placeholder.querySelector('small').textContent = 'Vine Trivia';
    }
  } catch (error) {
    if (active !== state || error.name === 'AbortError') return;
    state.status.textContent = 'Lens details could not load. You can still open Vine Trivia on Snapchat below.';
    state.start.hidden = true;
  }
}

window.addEventListener('portfolio:navigate', () => closePanel());
window.addEventListener('pagehide', () => closePanel());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && active?.config) stopCamera('Camera paused while you were away. Start it again when you’re ready.');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) closePanel(true);
});
