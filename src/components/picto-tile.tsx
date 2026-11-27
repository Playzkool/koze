import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pictoUrl } from '@/utils/arasaac';

type Props = {
  label: string;
  pictoId: number;
  size: number;
  isFolder?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** Visual cue that the tile can be removed (mode aidant). */
  removable?: boolean;
};

export function PictoTile({ label, pictoId, size, isFolder, onPress, onLongPress, removable }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={isFolder ? `Dossier ${label}` : label}
      accessibilityHint={removable ? 'Appui long pour supprimer' : undefined}
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size + 28,
          backgroundColor: isFolder ? theme.folder : theme.surface,
          borderColor: removable ? theme.danger : theme.border,
          borderStyle: removable ? 'dashed' : 'solid',
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}>
      <View style={styles.imageWrap}>
        <Image
          source={pictoUrl(pictoId)}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={120}
          accessible={false}
        />
      </View>
      <Text numberOfLines={2} style={[styles.label, { color: theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.tile,
    borderWidth: 2,
    borderCurve: 'continuous',
    padding: Spacing.two,
    alignItems: 'center',
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    // Pictograms are drawn on white; keep them readable in dark mode.
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.tile - 6,
    padding: Spacing.one,
  },
  image: { flex: 1 },
  label: {
    marginTop: Spacing.one,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Fonts?.rounded,
  },
});
