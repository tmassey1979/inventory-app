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

1. Install dependencies (`npm install`)
2. TypeScript check (`tsc --noEmit`)
3. Unit tests (`npm test`)

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

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
.github/workflows/      # CI
```

## License

MIT
