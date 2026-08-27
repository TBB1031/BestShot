const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');
const switchBtn = document.getElementById('switchBtn');
const photoBtn = document.getElementById('photoBtn');
const recordBtn = document.getElementById('recordBtn');
const errorMessage = document.getElementById('errorMessage');
const captureCanvas = document.getElementById('captureCanvas');

let stream = null;
let videoDevices = [];
let currentDeviceIndex = -1;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = '';
}

function stopStream() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
}

async function refreshVideoDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  videoDevices = devices.filter((device) => device.kind === 'videoinput');
}

async function openStream(constraints) {
  stopStream();
  stream = await navigator.mediaDevices.getUserMedia(constraints);
  verticalFrame.srcObject = stream;
  wideFrame.srcObject = stream;
}

function turnCameraOff() {
  if (isRecording) stopRecording();
  stopStream();
  verticalFrame.srcObject = null;
  wideFrame.srcObject = null;

  startBtn.textContent = 'Turn Camera On';
  switchBtn.disabled = true;
  photoBtn.disabled = true;
  recordBtn.disabled = true;
}

async function turnCameraOn() {
  try {
    clearError();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported in this browser.');
    }

    await openStream({ video: { facingMode: 'user' }, audio: false });
    await refreshVideoDevices();

    const activeDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;
    currentDeviceIndex = Math.max(0, videoDevices.findIndex((d) => d.deviceId === activeDeviceId));

    startBtn.textContent = 'Turn Camera Off';
    switchBtn.disabled = videoDevices.length < 2;
    photoBtn.disabled = false;
    recordBtn.disabled = false;
  } catch (err) {
    console.error(err);
    const messageByName = {
      NotAllowedError: 'Camera access was denied. Please allow camera permissions and try again.',
      NotFoundError: 'No camera was found on this device.',
      NotReadableError: 'The camera is already in use by another app.',
      OverconstrainedError: 'The requested camera settings are not available.'
    };

    showError(messageByName[err.name] || `Camera error: ${err.message}`);
  }
}

function toggleCamera() {
  if (stream) {
    turnCameraOff();
  } else {
    turnCameraOn();
  }
}

async function switchCamera() {
  if (videoDevices.length < 2) return;

  try {
    clearError();
    currentDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
    const deviceId = videoDevices[currentDeviceIndex].deviceId;

    await openStream({ video: { deviceId: { exact: deviceId } }, audio: false });
  } catch (err) {
    console.error(err);
    showError(`Unable to switch camera: ${err.message}`);
  }
}

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

function takePhoto() {
  if (!stream) return;

  const sourceVideo = wideFrame.videoWidth ? wideFrame : verticalFrame;
  captureCanvas.width = sourceVideo.videoWidth;
  captureCanvas.height = sourceVideo.videoHeight;

  const ctx = captureCanvas.getContext('2d');
  ctx.drawImage(sourceVideo, 0, 0, captureCanvas.width, captureCanvas.height);

  captureCanvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `photo-${Date.now()}.png`);
  }, 'image/png');
}

function pickSupportedMimeType() {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported(type)) || '';
}

function startRecording() {
  if (!stream) return;

  const mimeType = pickSupportedMimeType();
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  });

  mediaRecorder.addEventListener('stop', () => {
    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
    downloadBlob(blob, `video-${Date.now()}.webm`);
  });

  mediaRecorder.start();
  isRecording = true;
  recordBtn.textContent = 'Stop Recording';
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;
  recordBtn.textContent = 'Record Video';
}

function toggleRecording() {
  clearError();
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

startBtn.addEventListener('click', toggleCamera);
switchBtn.addEventListener('click', switchCamera);
photoBtn.addEventListener('click', takePhoto);
recordBtn.addEventListener('click', toggleRecording);
