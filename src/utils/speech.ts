import * as Speech from 'expo-speech';

const LANGUAGE = 'fr-FR';

/** Speak text, interrupting anything currently being said. */
export function say(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  Speech.stop();
  Speech.speak(trimmed, { language: LANGUAGE });
}
