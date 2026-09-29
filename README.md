# Personal Inventory Manager

Offline-first personal inventory management mobile app built with **Expo**, **React Native**, and **TypeScript**. Designed for buying, listing, and reselling physical items.

## Features

- **Fully offline** — all data stored locally with SQLite
- **Automatic 4-digit inventory numbers** (0001–9999) with gap reuse
- **Status workflow**: Added → Listed → Sold → Packed → Shipped (plus Delisted / Donated)
- **Status history timeline** with optional notes
- **Photo support** — camera or gallery, resized & stored persistently
- **Dashboard** with counts and financial summaries
- **Search & filters** (status, category, bin) via SQLite
- **Light / dark mode** support

## Technology Stack

- Expo SDK 52
- React Native 0.76
- TypeScript
- Expo Router (file-based navigation)
- expo-sqlite
- expo-image-picker / expo-image-manipulator / expo-file-system

## Requirements

- Node.js 18+
- npm
- Expo Go app (optional, for device testing)

## Installation

```bash
npm install
```

## Running

```bash
npx expo start
```

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with **Expo Go** on a physical device

## CI

GitHub Actions runs on every push/PR to `main`:

1. Install dependencies
2. TypeScript check (`tsc --noEmit`)
3. Unit tests (`npm test`)

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Standalone Android APK (no Expo Go)

You can install a **standalone** Android build that does **not** need Expo Go or a computer running a development server.

### 1. Create the `EXPO_TOKEN` GitHub secret

1. Sign in at [expo.dev](https://expo.dev) (create a free account if needed).
2. Open [Access tokens](https://expo.dev/settings/access-tokens) → **Create token**.
3. Copy the token.
4. In this GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.
5. Name: `EXPO_TOKEN`  
   Value: paste the Expo token → **Add secret**.

### 2. Link the project to EAS (one-time, via GitHub Actions)

You do **not** need to run `eas init` on a PC.

1. Ensure `EXPO_TOKEN` is set (step 1).
2. GitHub → **Actions** → **EAS Init (one-time)** → **Run workflow**.
3. Wait for it to finish. It will:
   - Create/link the Expo project using your token
   - Commit `projectId` into `app.json`
   - **Delete** the one-time workflow file from `main`

After that, only the regular APK build workflow remains.

### 3. Trigger the APK build

**Option A — automatic:** push to `main` (workflow: **Android Preview APK**).

**Option B — manual:**

1. GitHub → **Actions** → **Android Preview APK**
2. **Run workflow** → branch `main` → **Run workflow**

The job waits for EAS to finish (often 15–25 minutes).

### 4. Download the APK

When the run succeeds, each build **tags a GitHub Release** and attaches the APK:

1. Open **Releases**: https://github.com/tmassey1979/inventory-app/releases
2. Open the latest **Android** prerelease (tag like `android-v1.1.0-42`).
3. Download **`inventory-manager-preview.apk`** from Assets.

Also available as a workflow artifact named **`android-preview-apk`**, and via the EAS URL in the job summary.

### 5. Install on your Android phone

1. Download the APK from the Release (or artifact) onto the phone.
2. Allow install from that source if prompted (**Settings → Security → Install unknown apps**).
3. Open the APK and install.
4. Launch **Inventory Manager** — offline SQLite; **no Expo Go**, no development PC.

### Local EAS build (optional)

```bash
npx eas-cli build --platform android --profile preview
```

Requires an Expo account and a linked `projectId` in `app.json`.

## Testing

```bash
npm test
```

Covers inventory number formatting, currency helpers, and status validation.

## Project Structure

```
app/                    # Expo Router screens
src/
  components/           # Reusable UI
  db/                   # SQLite + repository
  models/               # TypeScript types
  hooks/                # Data hooks
  services/             # Image storage
  utils/                # Helpers
__tests__/              # Unit tests
.github/workflows/      # CI + EAS + APK release
```

## License

MIT
