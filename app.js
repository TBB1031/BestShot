const verticalFrame = document.getElementById('verticalFrame');
const wideFrame = document.getElementById('wideFrame');
const startBtn = document.getElementById('startBtn');

let stream = null;

/**
 * Requests the front-facing camera and mirrors its stream in both preview frames.
 *
 * Any previously opened stream is stopped before requesting a replacement so its
 * camera tracks do not remain active.
 *
 * @returns {Promise<void>} Resolves when both preview frames are playing.
 */
async function startCamera() {
  try {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    // Both aspect-ratio previews intentionally show the same camera stream.
    verticalFrame.srcObject = stream;
    wideFrame.srcObject = stream;

    // Calling play explicitly accommodates browsers that do not honor autoplay
    // until a stream has been assigned after a user gesture.
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
