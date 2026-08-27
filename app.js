const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');
const errorMessage = document.getElementById('errorMessage');

let stream = null;

async function startCamera() {
  try {
    errorMessage.hidden = true;
    errorMessage.textContent = '';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported in this browser.');
    }

    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
    }

    verticalFrame.srcObject = stream;
    wideFrame.srcObject = stream;

    startBtn.textContent = 'Camera Started';
    startBtn.disabled = true;
  } catch (err) {
    console.error(err);
    const messageByName = {
      NotAllowedError: 'Camera access was denied. Please allow camera permissions and try again.',
      NotFoundError: 'No camera was found on this device.',
      NotReadableError: 'The camera is already in use by another app.',
      OverconstrainedError: 'The requested camera settings are not available.'
    };

    errorMessage.textContent = messageByName[err.name] || `Camera error: ${err.message}`;
    errorMessage.hidden = false;
  }
}

startBtn.addEventListener('click', startCamera);
