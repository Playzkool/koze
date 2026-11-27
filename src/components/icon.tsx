import { SymbolView } from 'expo-symbols';

/** SF Symbols on iOS, Material Symbols on Android/web. Never use emoji for UI icons. */
const ICONS = {
  speak: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' },
  backspace: { ios: 'delete.left', android: 'backspace', web: 'backspace' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  add: { ios: 'plus', android: 'add', web: 'add' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 28, color }: { name: IconName; size?: number; color: string }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} accessible={false} />;
}
