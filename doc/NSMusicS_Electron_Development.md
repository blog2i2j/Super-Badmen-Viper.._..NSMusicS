# NSMusicS Electron Development Notes

This document restores the more detailed local-development notes that used to live directly in the old workspace README.

## Environment Baseline

Recommended baseline from the historical workspace README:

- Node.js: `20.15.0`
- npm: `10.4.0`

Install dependencies:

```sh
cd NSMusicS\NSMusicS-Electron
npm install
```

Or:

```sh
cd NSMusicS\NSMusicS-Electron
cnpm install
```

## MPV Setup

Install MPV separately for desktop playback support:

- MPV installation page: https://mpv.io/installation/

Historical unpack targets documented in the workspace:

- Windows: `NSMusicS\NSMusicS-Electron\resources\mpv-x86_64-20241124`
- macOS: `NSMusicS\NSMusicS-Electron\resources\mpv-x86_64-20241124`

## better-sqlite3 Recovery Options

The old workspace README documented two options.

### Method A: Manual Binary Replacement

This was previously documented as the recommended path when the environment already matched the expected Node version.

1. Delete:

```text
NSMusicS\NSMusicS-Electron\node_modules\better-sqlite3\build\Release\better_sqlite3.node
```

2. Copy the matching binary from:

```text
NSMusicS\NSMusicS-Electron\resources\node\win
NSMusicS\NSMusicS-Electron\resources\node\linux
NSMusicS\NSMusicS-Electron\resources\node\macos
```

3. Paste that binary into:

```text
NSMusicS\NSMusicS-Electron\node_modules\better-sqlite3\build\Release
```

### Method B: electron-rebuild

```sh
cd NSMusicS/NSMusicS-Electron/node_modules/better-sqlite3
npm install electron-rebuild -D
```

Then add the following script to `better-sqlite3/package.json`:

```json
"rebuild": "electron-rebuild -f -w better-sqlite3"
```

Run:

```sh
npm run rebuild
```

## Run And Build

Run development mode:

```sh
cd NSMusicS\NSMusicS-Electron
npm run dev
```

Build the desktop package:

```sh
cd NSMusicS\NSMusicS-Electron
npm run build
```
