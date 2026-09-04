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
    // Stop existing stream if restarting
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    // Attach SAME stream to both video elements
    verticalFrame.srcObject = stream;
    wideFrame.srcObject = stream;

    // Required for some Safari versions
    await Promise.all([
      verticalFrame.play(),
      wideFrame.play()
    ]);

    startBtn.textContent = "Camera Started";
    startBtn.disabled = true;

  } catch (err) {
    console.error(err);

    alert(`Camera error: ${err.message}`);
  }
}

startBtn.addEventListener('click', toggleCamera);
switchBtn.addEventListener('click', switchCamera);
photoBtn.addEventListener('click', takePhoto);
recordBtn.addEventListener('click', toggleRecording);
