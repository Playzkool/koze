import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { TileImage as TileImageData } from '@/store/boards';
import { photoUri } from '@/utils/photo';
import { pictoSource } from '@/utils/picto-store';

/** Background colors for text-only tiles. All pass WCAG AA with near-black text. */
export const TEXT_TILE_COLORS = ['#FFE08A', '#A8E6CF', '#B5D8FF', '#FFC2C2', '#E0C3FC', '#FFFFFF'] as const;

type Props = {
  image: TileImageData;
  /** Shown inside the box for text-only tiles. */
  label: string;
  /** A temporary photo uri (not yet persisted) takes precedence for previews. */
  previewUri?: string;
  radius?: number;
  textSize?: number;
};

/** Square visual for a tile: ARASAAC picto, caregiver photo, or large text. */
export function TileImage({ image, label, previewUri, radius = 10, textSize = 22 }: Props) {
  if (image.kind === 'text') {
    return (
      <View style={[styles.box, styles.textBox, { backgroundColor: image.color, borderRadius: radius }]}>
        <Text
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[styles.text, { fontSize: textSize }]}>
          {label || '…'}
        </Text>
      </View>
    );
  }

  const source = previewUri ?? (image.kind === 'photo' ? photoUri(image.file) : pictoSource(image.id));
  const isPhoto = image.kind === 'photo' || !!previewUri;

  return (
    <View style={[styles.box, { borderRadius: radius }, !isPhoto && styles.pictoPadding]}>
      <Image
        source={source}
        style={[styles.image, isPhoto && { borderRadius: radius }]}
        contentFit={isPhoto ? 'cover' : 'contain'}
        cachePolicy="memory-disk"
        transition={120}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    width: '100%',
    // ARASAAC pictograms are drawn on white; keep them readable in dark mode.
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  pictoPadding: { padding: 4 },
  image: { flex: 1 },
  textBox: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  text: {
    color: '#111418',
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: Fonts?.rounded,
  },
});
