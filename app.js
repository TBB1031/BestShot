const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');
const switchBtn = document.getElementById('switchBtn');
const captureBtn = document.getElementById('captureBtn');
const flipBtn = document.getElementById('flipBtn');
const galleryBtn = document.getElementById('galleryBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');
const capturesSection = document.getElementById('captures');
const verticalPhoto = document.getElementById('verticalPhoto');
const widePhoto = document.getElementById('widePhoto');
const verticalDownload = document.getElementById('verticalDownload');
const wideDownload = document.getElementById('wideDownload');
const captureCanvas = document.getElementById('captureCanvas');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeBtn = document.getElementById('closeBtn');
const modalClose = document.getElementById('modalClose');
const settingsBtn = document.getElementById('settingsBtn');

let stream = null;
let facingMode = 'user';

function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function stopStream() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  if (verticalFrame) verticalFrame.srcObject = null;
  if (wideFrame) wideFrame.srcObject = null;
}

function disableCaptureControls() {
  if (captureBtn) captureBtn.disabled = true;
  if (switchBtn) switchBtn.disabled = true;
  if (flipBtn) flipBtn.disabled = true;
}

function enableCaptureControls() {
  if (captureBtn) captureBtn.disabled = false;
  if (switchBtn) switchBtn.disabled = false;
  if (flipBtn) flipBtn.disabled = false;
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Camera access is not supported in this browser.');
    return;
  }

  try {
    stopStream();

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });

    if (verticalFrame) verticalFrame.srcObject = stream;
    if (wideFrame) wideFrame.srcObject = stream;

    await Promise.all([
      verticalFrame ? verticalFrame.play() : Promise.resolve(),
      wideFrame ? wideFrame.play() : Promise.resolve(),
    ]);

    if (startBtn) startBtn.textContent = 'Stop Camera';
    enableCaptureControls();
    setStatus('Camera is live');
  } catch (error) {
    console.error(error);
    setStatus('Camera permission was denied or unavailable.');
    if (startBtn) startBtn.textContent = 'Start Camera';
    disableCaptureControls();
  }
}

function toggleCamera() {
  if (stream) {
    stopStream();
    if (startBtn) startBtn.textContent = 'Start Camera';
    disableCaptureControls();
    setStatus('Camera is off');
    return;
  }

  startCamera();
}

async function switchCamera() {
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  if (stream) {
    await startCamera();
  }
}

function cropAndDownload(video, aspect, targetImage, downloadLink, filename) {
  const canvas = captureCanvas;
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 720;
  const sourceAspect = sourceWidth / sourceHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let x = 0;
  let y = 0;

  if (sourceAspect > aspect) {
    cropWidth = sourceHeight * aspect;
    x = (sourceWidth - cropWidth) / 2;
  } else if (sourceAspect < aspect) {
    cropHeight = sourceWidth / aspect;
    y = (sourceHeight - cropHeight) / 2;
  }

  const targetWidth = aspect > 1 ? 1200 : 900;
  const targetHeight = aspect > 1 ? 900 : 1600;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    video,
    x,
    y,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  targetImage.src = dataUrl;
  targetImage.hidden = false;
  downloadLink.href = dataUrl;
  downloadLink.setAttribute('download', filename);
  downloadLink.hidden = false;
}

function capturePhotos() {
  if (!stream || !verticalFrame || !wideFrame) {
    setStatus('Start the camera before capturing.');
    return;
  }

  cropAndDownload(verticalFrame, 9 / 16, verticalPhoto, verticalDownload, 'dual-camera-vertical.jpg');
  cropAndDownload(wideFrame, 16 / 9, widePhoto, wideDownload, 'dual-camera-wide.jpg');

  if (capturesSection) {
    capturesSection.hidden = false;
  }

  setStatus('Photos captured');
}

function clearCaptures() {
  if (verticalPhoto) {
    verticalPhoto.removeAttribute('src');
    verticalPhoto.hidden = true;
  }

  if (widePhoto) {
    widePhoto.removeAttribute('src');
    widePhoto.hidden = true;
  }

  if (verticalDownload) verticalDownload.removeAttribute('href');
  if (wideDownload) wideDownload.removeAttribute('href');

  if (capturesSection) {
    capturesSection.hidden = true;
  }
}

function openInfoModal() {
  if (infoModal) {
    infoModal.hidden = false;
  }
}

function closeInfoModal() {
  if (infoModal) {
    infoModal.hidden = true;
  }
}

if (startBtn) {
  startBtn.addEventListener('click', toggleCamera);
}

if (switchBtn) {
  switchBtn.addEventListener('click', switchCamera);
}

if (captureBtn) {
  captureBtn.addEventListener('click', capturePhotos);
}

if (flipBtn) {
  flipBtn.addEventListener('click', switchCamera);
}

if (galleryBtn) {
  galleryBtn.addEventListener('click', () => {
    if (capturesSection) {
      capturesSection.hidden = !capturesSection.hidden;
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', clearCaptures);
}

if (infoBtn) {
  infoBtn.addEventListener('click', openInfoModal);
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    if (window.location.pathname.endsWith('index.html')) {
      window.location.href = 'about:blank';
    }
  });
}

if (modalClose) {
  modalClose.addEventListener('click', closeInfoModal);
}

if (settingsBtn) {
  settingsBtn.addEventListener('click', openInfoModal);
}

disableCaptureControls();
setStatus('Camera is off');
