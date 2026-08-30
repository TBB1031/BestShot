# BestShot

A modern dual-camera web application for capturing photos and videos from multiple camera perspectives simultaneously.

## Features

- **Dual Camera Display** - View vertical and wide-angle camera feeds side-by-side on a single screen
- **Photo Capture** - Capture high-quality images from both camera perspectives
- **Video Recording** - Record videos from the active camera stream
- **Multi-Camera Support** - Switch between available camera devices
- **Responsive Design** - Optimized layout that fits all controls on screen without scrolling
- **Accessibility** - Full ARIA labels and keyboard support
- **Error Handling** - Clear error messages for permission and compatibility issues

## Usage

1. Open the app in a modern web browser
2. Click the camera icon to request camera permissions
3. Use the shutter button to take photos (captures from both cameras)
4. Use the record button to start/stop video recording
5. Use the switch button to change camera devices (if multiple available)

## Technical Improvements

### Layout & Performance

- Fixed dual camera layout using CSS Grid (1fr 2fr columns) to fit on one screen without scrolling
- Added `min-height: 0` and `overflow: hidden` for proper flex/grid behavior
- Optimized touch actions for mobile devices

### Code Quality

- Reorganized DOM element selectors into a centralized `UI` object for better maintainability
- Consolidated application state into a `STATE` object for easier state management
- Added comprehensive JSDoc comments for all functions
- Improved error handling with try-catch blocks and detailed error messages
- Better device enumeration with fallback handling

### UI/UX Enhancements

- Added smooth transitions and hover effects to buttons
- Added focus-visible outlines for better keyboard navigation
- Enhanced visual feedback with box-shadow effects on active buttons
- Improved touch interaction with `touch-action: manipulation`

### Accessibility

- Maintained ARIA labels and `aria-pressed` attributes
- Added semantic role attributes
- Focus-visible outlines for keyboard users
- Clear error messages for accessibility compliance

## Browser Support

Requires a modern browser with support for:

- MediaDevices API
- WebRTC/getUserMedia
- CSS Grid
- ES6+ JavaScript features
