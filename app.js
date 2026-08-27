const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');

let stream = null;

async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported in this browser.');
    }

    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
    }

    const [videoTrack] = stream.getVideoTracks();

    verticalFrame.srcObject = new MediaStream([videoTrack]);
    wideFrame.srcObject = new MediaStream([videoTrack]);

    await Promise.all([verticalFrame.play(), wideFrame.play()]);

    startBtn.textContent = 'Camera Started';
    startBtn.disabled = true;
  } catch (err) {
    console.error(err);
    alert('Camera error: ' + err.message);
  }
}

startBtn.addEventListener('click', startCamera);
