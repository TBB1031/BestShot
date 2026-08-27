const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');
const errorMessage = document.getElementById('errorMessage');

let stream = null;
let previewStreams = null;

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

    if (!previewStreams) {
      const [videoTrack] = stream.getVideoTracks();

      previewStreams = {
        vertical: new MediaStream([videoTrack]),
        wide: new MediaStream([videoTrack.clone()])
      };
    }

    verticalFrame.srcObject = previewStreams.vertical;
    wideFrame.srcObject = previewStreams.wide;

    await Promise.all([verticalFrame.play(), wideFrame.play()]);

    startBtn.textContent = 'Camera Started';
    startBtn.disabled = true;
  } catch (err) {
    console.error(err);
    errorMessage.textContent = 'Camera error: ' + err.message;
    errorMessage.hidden = false;
  }
}

startBtn.addEventListener('click', startCamera);
