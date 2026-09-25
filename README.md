# Inventory Manager

Offline personal inventory app for buy/resell workflows.

Built with **Expo**, **React Native**, **TypeScript**, **Expo Router**, and **expo-sqlite**.

## Features

- Automatic 4-digit inventory numbers
- Status workflow: Added → Listed → Sold → Packed → Shipped (+ Delisted / Donated)
- Local photos and shipping labels on device filesystem
- Search, filters, dashboard stats
- Multi-photo gallery per item
- Barcode / QR scan
- CSV / JSON export & import (merge by inventory number)
- Swipe left for quick status changes
- Marketplace platform + listing URL
- Fees & shipping cost → net profit
- Print packing slip, shipping label, and checklist
- Same-network hand-off via export/import (no cloud backend)
- Haptics and system light/dark mode

## Run

```bash
npm install
npx expo start
```

Use Expo Go on your phone, or an iOS/Android simulator.

## v1.1 features

- Barcode scan (Tools → Scan)
- CSV / JSON export & import (merge by inventory number)
- Swipe left on list for quick status (Listed / Sold / Packed / Shipped …)
- Multi-photo gallery per item
- Shipping labels: attach image, print via system printer
- Packing slip + shipping checklist print
- Marketplace platform + listing URL
- Fees & shipping cost → net profit on dashboard and detail
- Haptics on key actions
- Dark / light follows system
- LAN sync screen (same Wi‑Fi): export/import is reliable in Expo Go; live HTTP pull needs a dev client with a native HTTP bridge

## LAN sync without a cloud backend

1. **Recommended (works in Expo Go):** on device A open Tools → Export JSON → share via AirDrop / Nearby Share / Files. On device B open Tools → Import JSON. Merge is by inventory number.
2. **Same Wi‑Fi host UI:** Tools → LAN sync shows this device IP. Live TCP host is not available inside Expo Go; use export/import, or build a custom dev client that serves `GET /sync`.

## Tests

```bash
npm test
npm run typecheck
```

## License

Private / personal use.
