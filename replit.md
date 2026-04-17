# Arabic Flashcard App — Workspace

## Overview

pnpm workspace monorepo. The primary artifact is a React Native (Expo) mobile app for Arabic vocabulary learning.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo (SDK 54), Expo Router, React Native
- **Persistence**: AsyncStorage (on-device, no server needed)
- **Translation**: DeepL Free API (`api-free.deepl.com`)
- **Voice**: expo-audio for recording; on-device Whisper stub (requires EAS native build)
- **Spaced Repetition**: SM-2 algorithm (custom implementation in `lib/sm2.ts`)
- **API framework**: Express 5 (not used by mobile app in V1)

## Key Secrets

- `DEEPL_API_KEY` — DeepL Free API key, exposed to Expo as `EXPO_PUBLIC_DEEPL_API_KEY`

## Mobile App Structure (`artifacts/mobile/`)

```
app/
  _layout.tsx              # Root layout: providers, stack config
  (tabs)/
    _layout.tsx            # Tab bar: Decks + Translate
    index.tsx              # Home — deck list + floating bubble
    translate.tsx          # Translation screen
  deck/[id].tsx            # Deck detail: card list + review banner
  create-card.tsx          # Flashcard creation screen
  review.tsx               # SM-2 spaced repetition review
  card/[id].tsx            # Card detail + edit + move

components/
  ArabicText.tsx           # RTL Arabic text component
  DeckCard.tsx             # Deck list item
  FloatingBubble.tsx       # Draggable overlay bubble (Android)
  MicButton.tsx            # Voice record button (expo-audio)
  TranslationPanel.tsx     # Translation widget (DeepL)

context/
  AppContext.tsx            # Global state: decks, cards, due counts

lib/
  storage.ts               # AsyncStorage CRUD for decks + cards
  sm2.ts                   # SM-2 spaced repetition algorithm
  deepl.ts                 # DeepL API client
  whisper.ts               # Whisper stub (EAS build only)

constants/
  colors.ts                # Dark-first color palette (gold + dark navy)
```

## Features

1. **Floating Bubble** — draggable overlay across apps (Android), tap to open translate popup
2. **Translation** — DeepL Free API, Arabic ↔ English auto-detected
3. **Voice Input** — expo-audio recording; Whisper transcription requires EAS native build
4. **Flashcard Creation** — Arabic/English pre-filled from translation, context + grammar notes, dialect
5. **Deck Management** — named decks, MSA or Egyptian dialect, card counts + due counts
6. **Spaced Repetition** — SM-2, flip card UI, Again/Hard/Easy grading
7. **Share Sheet** — Android intent filter for "Add to Flashcard" (requires native build config)

## V1 Limitations (intentional)

- No user accounts, no cloud sync, no iOS support
- Whisper transcription shows placeholder in Expo Go (requires EAS native build)
- Share Sheet integration requires EAS native build for Android intent filter
- SYSTEM_ALERT_WINDOW (true floating overlay across apps) requires native build

## Key Commands

- `pnpm --filter @workspace/mobile run dev` — start Expo dev server
- `pnpm --filter @workspace/api-server run dev` — start API server (not used in V1)
