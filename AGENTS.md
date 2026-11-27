This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Kozé — project rules

Kozé is a free AAC (communication alternative et augmentée) app: pictogram boards + text-to-speech.

- **Free forever, no backend**: no account, no ads, no analytics, no IAP. All user data stays on device (`expo-sqlite/kv-store`, see `src/store/boards.ts`).
- **Pictograms**: ARASAAC public API (`src/utils/arasaac.ts`), CC BY-NC-SA. Attribution must stay visible in the About screen. Never use them commercially.
- **Offline pictograms**: the default vocabulary is bundled (`assets/pictos/`, `src/data/default-pictos.ts`); after editing `src/data/default-boards.ts`, run `npm run pictos:bundle`. Other pictograms used on boards are downloaded to Documents by `src/utils/picto-store.ts`. Render pictograms with `pictoSource(id)`, never the raw ARASAAC URL (the expo-image cache is purged by the OS).
- **Privacy policy**: `docs/confidentialite.html` (GitHub Pages). Update it whenever the app gains a network call, a permission or a third-party service.
- **Accessibility first**: touch targets ≥ 64pt (`MinTouch`), high contrast, every pressable has `accessibilityLabel`. Board navigation is local state, not routes — instant, no animation.
- **Language**: UI and default vocabulary in French.
- **Navigation**: never wrap a component with a style array in `<Link asChild>` (Expo Router's Slot throws). Use `Pressable` + `router.push` instead.
- **License**: code is GPL-3.0-only (`LICENSE`) + App Store additional permission (`LICENSE-APP-STORE-EXCEPTION`). Do not add dependencies whose license is incompatible with GPL-3.0. The exception requires the public source repo (https://github.com/Playzkool/koze) to stay linked from the About screen (`SOURCE_URL` in `src/screens/about.tsx`) and the store listings.

## EAS Build & Runtime Version

`runtimeVersion` in `app.json` is a **fixed string** (e.g. `"1.0.0"`). Bump it only when a new native build is required (native module added/removed, SDK upgrade, native config plugin change). JS-only changes ship as OTA updates.

The user runs EAS builds themselves. Never run `eas build` unless explicitly asked.

## Tests

- `npm run test:unit`: unit tests (`src/**/*.test.ts`, node:test via tsx). Keep tested modules free of React Native imports (see `src/utils/backup-format.ts`).
- `npm run test:e2e`: Maestro flows in `.maestro/` against Expo Go; requires Metro running (see `.maestro/README.md`).
- Run both after upgrading packages or the Expo SDK.
- Interactive elements carry a `testID` used by the Maestro flows: keep them when refactoring, and add one to every new interactive element.
