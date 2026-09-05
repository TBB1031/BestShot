const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');
const switchBtn = document.getElementById('switchBtn');
const captureBtn = document.getElementById('captureBtn');
const flipBtn = document.getElementById('flipBtn');
const galleryBtn = document.getElementById('galleryBtn');
const clearBtn = document.getElementById('clearBtn');
const lensLabel = document.getElementById('lensLabel');
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

/**
 * Updates the lens control to reflect the preferred camera direction.
 *
 * @returns {void}
 */
function updateCameraLabel() {
  if (lensLabel) {
    lensLabel.textContent = facingMode === 'user' ? 'Front' : 'Rear';
  }
}

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

/**
 * Opens the preferred camera, mirrors its stream in both previews, and enables
 * the controls that require a live stream.
 *
 * @returns {Promise<void>}
 */
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

    // Both aspect-ratio previews intentionally show the same camera stream.
    if (verticalFrame) verticalFrame.srcObject = stream;
    if (wideFrame) wideFrame.srcObject = stream;

    // Explicit playback accommodates browsers that defer autoplay until a stream
    // is assigned as the result of a user gesture.
    await Promise.all([
      verticalFrame ? verticalFrame.play() : Promise.resolve(),
      wideFrame ? wideFrame.play() : Promise.resolve(),
    ]);

    if (startBtn) startBtn.textContent = 'Stop Camera';
    updateCameraLabel();
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
  updateCameraLabel();
  await startCamera();
}

function dataUrlToBlob(dataUrl) {
  const [header, encodedData] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bytes = atob(encodedData);
  const buffer = new Uint8Array(bytes.length);

  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index);
  }

  return new Blob([buffer], { type: mimeType });
}

function setDownloadLink(link, dataUrl, filename) {
  if (!link) {
    return;
  }

  if (link.dataset.objectUrl) {
    URL.revokeObjectURL(link.dataset.objectUrl);
  }

  const blob = dataUrlToBlob(dataUrl);
  const objectUrl = URL.createObjectURL(blob);

  link.dataset.objectUrl = objectUrl;
  link.href = objectUrl;
  link.setAttribute('download', filename);
  link.hidden = false;
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
  setDownloadLink(downloadLink, dataUrl, filename);
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

  if (verticalDownload) {
    if (verticalDownload.dataset.objectUrl) {
      URL.revokeObjectURL(verticalDownload.dataset.objectUrl);
      delete verticalDownload.dataset.objectUrl;
    }
    verticalDownload.removeAttribute('href');
    verticalDownload.hidden = true;
  }

  if (wideDownload) {
    if (wideDownload.dataset.objectUrl) {
      URL.revokeObjectURL(wideDownload.dataset.objectUrl);
      delete wideDownload.dataset.objectUrl;
    }
    wideDownload.removeAttribute('href');
    wideDownload.hidden = true;
  }

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
updateCameraLabel();
setStatus('Camera is off');
