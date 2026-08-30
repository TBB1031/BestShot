// DOM Element Caching
const UI = {
  verticalFrame: document.getElementById('verticalFrame'),
  wideFrame: document.getElementById('wideFrame'),
  startBtn: document.getElementById('startBtn'),
  switchBtn: document.getElementById('switchBtn'),
  photoBtn: document.getElementById('photoBtn'),
  recordBtn: document.getElementById('recordBtn'),
  errorMessage: document.getElementById('errorMessage'),
  captureCanvas: document.getElementById('captureCanvas'),
};

// Application State
const STATE = {
  stream: null,
  videoDevices: [],
  currentDeviceIndex: -1,
  mediaRecorder: null,
  recordedChunks: [],
  isRecording: false,
};

/**
 * Display an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
  UI.errorMessage.textContent = message;
  UI.errorMessage.hidden = false;
}

/**
 * Clear any displayed error message
 */
function clearError() {
  UI.errorMessage.hidden = true;
  UI.errorMessage.textContent = '';
}

/**
 * Stop the current media stream and release all tracks
 */
function stopStream() {
  if (STATE.stream) {
    STATE.stream.getTracks().forEach((track) => track.stop());
    STATE.stream = null;
  }
}

/**
 * Query and cache available video input devices
 */
async function refreshVideoDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    STATE.videoDevices = devices.filter((device) => device.kind === 'videoinput');
  } catch (err) {
    console.warn('Failed to enumerate devices:', err);
  }
}

/**
 * Request user media and attach stream to video elements
 * @param {MediaStreamConstraints} constraints - Constraints for getUserMedia
 * @throws {Error} If media stream request fails
 */
async function openStream(constraints) {
  stopStream();
  STATE.stream = await navigator.mediaDevices.getUserMedia(constraints);
  UI.verticalFrame.srcObject = STATE.stream;
  UI.wideFrame.srcObject = STATE.stream;
}

/**
 * Turn off the camera and cleanup resources
 */
function turnCameraOff() {
  if (STATE.isRecording) stopRecording();
  stopStream();
  UI.verticalFrame.srcObject = null;
  UI.wideFrame.srcObject = null;

  UI.startBtn.setAttribute('aria-pressed', 'false');
  UI.startBtn.setAttribute('aria-label', 'Turn camera on');
  UI.startBtn.classList.remove('active');
  UI.switchBtn.disabled = true;
  UI.photoBtn.disabled = true;
  UI.recordBtn.disabled = true;
}

/**
 * Turn on the camera and enable controls
 */
async function turnCameraOn() {
  try {
    clearError();

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access is not supported in this browser.');
    }

    await openStream({ video: { facingMode: 'user' }, audio: false });
    await refreshVideoDevices();

    const activeDeviceId = STATE.stream?.getVideoTracks()[0]?.getSettings().deviceId;
    STATE.currentDeviceIndex = Math.max(0, STATE.videoDevices.findIndex((d) => d.deviceId === activeDeviceId));

    UI.startBtn.setAttribute('aria-pressed', 'true');
    UI.startBtn.setAttribute('aria-label', 'Turn camera off');
    UI.startBtn.classList.add('active');
    UI.switchBtn.disabled = STATE.videoDevices.length < 2;
    UI.photoBtn.disabled = false;
    UI.recordBtn.disabled = false;
  } catch (err) {
    console.error('Camera initialization failed:', err);
    const messageByName = {
      NotAllowedError: 'Camera access was denied. Please allow camera permissions and try again.',
      NotFoundError: 'No camera was found on this device.',
      NotReadableError: 'The camera is already in use by another app.',
      OverconstrainedError: 'The requested camera settings are not available.'
    };

    showError(messageByName[err.name] || `Camera error: ${err.message}`);
  }
}

/**
 * Toggle camera on/off state
 */
function toggleCamera() {
  if (STATE.stream) {
    turnCameraOff();
  } else {
    turnCameraOn();
  }
}

/**
 * Switch to the next available camera device
 */
async function switchCamera() {
  if (STATE.videoDevices.length < 2) return;

  try {
    clearError();
    STATE.currentDeviceIndex = (STATE.currentDeviceIndex + 1) % STATE.videoDevices.length;
    const deviceId = STATE.videoDevices[STATE.currentDeviceIndex].deviceId;

    await openStream({ video: { deviceId: { exact: deviceId } }, audio: false });
  } catch (err) {
    console.error('Camera switch failed:', err);
    showError(`Unable to switch camera: ${err.message}`);
  }
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename to save as
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Capture a cropped frame from video element with object-fit: cover applied
 * @param {HTMLVideoElement} videoEl - The video element to capture from
 * @returns {Promise<Blob>} A promise that resolves to the captured frame as PNG blob
 */
function captureCroppedFrame(videoEl) {
  const targetRatio = videoEl.clientWidth / videoEl.clientHeight;
  const sourceRatio = videoEl.videoWidth / videoEl.videoHeight;

  let cropWidth = videoEl.videoWidth;
  let cropHeight = videoEl.videoHeight;

  if (sourceRatio > targetRatio) {
    cropWidth = videoEl.videoHeight * targetRatio;
  } else {
    cropHeight = videoEl.videoWidth / targetRatio;
  }

  const cropX = (videoEl.videoWidth - cropWidth) / 2;
  const cropY = (videoEl.videoHeight - cropHeight) / 2;

  UI.captureCanvas.width = cropWidth;
  UI.captureCanvas.height = cropHeight;

  const ctx = UI.captureCanvas.getContext('2d');
  ctx.clearRect(0, 0, cropWidth, cropHeight);
  ctx.drawImage(videoEl, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return new Promise((resolve) => UI.captureCanvas.toBlob(resolve, 'image/png'));
}

/**
 * Capture photos from both camera frames and download them
 */
async function takePhoto() {
  if (!STATE.stream) return;

  const timestamp = Date.now();

  try {
    const verticalBlob = await captureCroppedFrame(UI.verticalFrame);
    if (verticalBlob) downloadBlob(verticalBlob, `photo-vertical-${timestamp}.png`);

    const wideBlob = await captureCroppedFrame(UI.wideFrame);
    if (wideBlob) downloadBlob(wideBlob, `photo-wide-${timestamp}.png`);
  } catch (err) {
    console.error('Photo capture failed:', err);
    showError('Failed to capture photo');
  }
}

/**
 * Determine the best supported video MIME type for recording
 * @returns {string} The MIME type string or empty string if none supported
 */
function pickSupportedMimeType() {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported(type)) || '';
}

/**
 * Start recording video from the media stream
 */
function startRecording() {
  if (!STATE.stream) return;

  const mimeType = pickSupportedMimeType();
  STATE.recordedChunks = [];
  
  try {
    STATE.mediaRecorder = new MediaRecorder(STATE.stream, mimeType ? { mimeType } : undefined);

    STATE.mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) STATE.recordedChunks.push(event.data);
    });

    STATE.mediaRecorder.addEventListener('stop', () => {
      const blob = new Blob(STATE.recordedChunks, { type: STATE.mediaRecorder.mimeType || 'video/webm' });
      downloadBlob(blob, `video-${Date.now()}.webm`);

      STATE.mediaRecorder = null;
      STATE.recordedChunks = [];
    });

    STATE.mediaRecorder.addEventListener('error', (err) => {
      console.error('Recording error:', err);
      showError('Recording failed');
    });

    STATE.mediaRecorder.start();
    STATE.isRecording = true;
    UI.recordBtn.setAttribute('aria-pressed', 'true');
    UI.recordBtn.setAttribute('aria-label', 'Stop recording');
    UI.recordBtn.classList.add('active');
  } catch (err) {
    console.error('Failed to start recording:', err);
    showError('Unable to start recording');
  }
}

/**
 * Stop the current video recording
 */
function stopRecording() {
  if (STATE.mediaRecorder && STATE.mediaRecorder.state !== 'inactive') {
    STATE.mediaRecorder.stop();
    return;
  }

  STATE.isRecording = false;
  STATE.mediaRecorder = null;
  STATE.recordedChunks = [];
  UI.recordBtn.setAttribute('aria-pressed', 'false');
  UI.recordBtn.setAttribute('aria-label', 'Start recording');
  UI.recordBtn.classList.remove('active');
}

/**
 * Toggle recording on/off state
 */
function toggleRecording() {
  clearError();
  if (STATE.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// Initialize event listeners
UI.startBtn.addEventListener('click', toggleCamera);
UI.switchBtn.addEventListener('click', switchCamera);
UI.photoBtn.addEventListener('click', takePhoto);
UI.recordBtn.addEventListener('click', toggleRecording);

// Prevent default touch actions for better mobile feel
document.addEventListener('touchmove', (e) => {
  if (e.target.closest('button')) e.preventDefault();
}, { passive: false });
