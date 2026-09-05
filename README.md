# BestShot

BestShot is a small, static camera-preview web app. After permission is granted, it opens the device's front-facing camera and displays the same live stream in portrait and landscape frames.

## Run locally

Serve the repository with any static HTTP server, then open the served URL in a supported browser. For example, with Node.js:

```sh
npx serve .
```

Camera access requires a secure context: use `https://` in production or `http://localhost` while developing. Opening `index.html` directly from the file system may prevent the browser from granting camera access.

## Usage

1. Open the app and select **Start Camera**.
2. Grant the browser permission to use the camera.
3. View the front-facing stream in both aspect-ratio previews.

The button becomes disabled after the stream begins. Reload the page to request and start a new stream.

## Implementation

- `index.html` defines the two muted, inline video previews and the start control.
- `app.js` requests a video-only `MediaStream` with a `facingMode` preference of `user`, then attaches that one stream to both previews.
- `styles.css` presents the previews as stacked 9:16 and 16:9 frames and accounts for mobile safe-area insets.
- `.github/workflows/static.yml` deploys the repository's static files to GitHub Pages whenever `main` is updated.

## Browser support

Use a current browser that supports the MediaDevices API, `getUserMedia`, async functions, CSS custom properties, and `aspect-ratio`. A device must have an available camera, and the browser must allow camera permissions.
