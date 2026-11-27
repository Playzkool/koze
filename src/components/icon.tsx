import { SymbolView } from 'expo-symbols';

/** SF Symbols on iOS, Material Symbols on Android/web. Never use emoji for UI icons. */
const ICONS = {
  speak: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' },
  backspace: { ios: 'delete.left', android: 'backspace', web: 'backspace' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  folderAdd: { ios: 'folder.badge.plus', android: 'create_new_folder', web: 'create_new_folder' },
  camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  photos: { ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  download: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 28, color }: { name: IconName; size?: number; color: string }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} accessible={false} />;
}
