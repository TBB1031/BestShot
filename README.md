# BestShot

BestShot is a small, static camera app. After permission is granted, it opens a camera stream and displays it in portrait and landscape frames. The shutter produces separate 9:16 and 16:9 photos cropped from the same moment.

## Run locally

Serve the repository with any static HTTP server, then open the served URL in a supported browser. For example, with Node.js:

```sh
npx serve .
```

Camera access requires a secure context: use `https://` in production or `http://localhost` while developing. Opening `index.html` directly from the file system may prevent the browser from granting camera access.

## Usage

1. Open the app and select **Start Camera**.
2. Grant the browser permission to use the camera.
3. Use the shutter to capture 9:16 and 16:9 photos, then save or clear them from the capture gallery.
4. Use the camera switch control to alternate between front and rear camera preferences.

The start control toggles the camera stream on and off. The app mirrors that one stream in both previews; it does not open two cameras simultaneously.

## Implementation

- `index.html` defines the two muted, inline video previews and the start control.
- `app.js` requests a video-only `MediaStream`, attaches it to both previews, controls the preferred camera direction, and crops captured frames into downloadable JPEGs.
- `styles.css` presents the previews as 9:16 and 16:9 frames, provides mobile-oriented controls, and accounts for mobile safe-area insets.
- `.github/workflows/static.yml` deploys the repository's static files to GitHub Pages whenever `main` is updated.

## Browser support

Use a current browser that supports the MediaDevices API, `getUserMedia`, async functions, CSS custom properties, and `aspect-ratio`. A device must have an available camera, and the browser must allow camera permissions.
