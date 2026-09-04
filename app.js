const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');

let stream = null;

async function startCamera() {
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

startBtn.addEventListener('click', startCamera);
