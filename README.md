# VORTEX PWA 1.0

Installable Home Screen web app for iPhone Safari.

## Included
- Add to Home Screen PWA manifest and service worker shell caching
- Offline app shell after first successful load
- Import local audio/video files from the iPhone Files picker
- Store imported media blobs in IndexedDB
- Offline playback with native HTML media controls
- Optional direct media URL fetch for servers that permit CORS
- Local library management and deletion

## Deploy
A service worker requires HTTPS (or localhost). Upload the contents of this folder to any static HTTPS host, such as GitHub Pages, Cloudflare Pages, or Netlify. No backend is required. Keep the deployment private if desired.

## iPhone install
1. Open the deployed HTTPS address in Safari (not an in-app browser).
2. Wait for the page to load once while online.
3. Tap Share -> Add to Home Screen -> Add.
4. Open VORTEX from the Home Screen.
5. Use Add media -> Choose files to import media from Files.

## Limits
- This is a PWA, not a native Swift app.
- Safari/iOS may evict website storage under storage pressure; keep backups.
- Large video imports may fail due to device/browser storage limits.
- URL fetch requires CORS permission from the media host; downloads are not guaranteed to continue after Safari is suspended.
- The app does not download/extract YouTube streams. Use YouTube's official app/site for supported online playback and offline features.
