import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { TileImage } from '@/components/tile-image';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tile } from '@/store/boards';

type Props = {
  tile: Tile;
  size: number;
  onPress: () => void;
  /** Mode aidant: shows an edit badge on the tile. */
  onEdit?: () => void;
};

export function PictoTile({ tile, size, onPress, onEdit }: Props) {
  const theme = useTheme();
  const isFolder = !!tile.boardId;
  const isText = tile.image.kind === 'text';

  return (
    <View style={{ width: size, height: size + 28 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={isFolder ? `Catégorie ${tile.label}` : tile.label}
        style={({ pressed }) => [
          styles.tile,
          {
            backgroundColor: isFolder ? theme.folder : theme.surface,
            borderColor: onEdit ? theme.accent : theme.border,
            borderStyle: onEdit ? 'dashed' : 'solid',
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}>
        <TileImage image={tile.image} label={tile.label} radius={Radius.tile - 6} textSize={size / 5} />
        {/* Text-only tiles already show the label in the box. */}
        {!isText && (
          <Text numberOfLines={2} style={[styles.label, { color: theme.text }]}>
            {tile.label}
          </Text>
        )}
      </Pressable>

      {onEdit && (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Modifier ${tile.label}`}
          style={[styles.editBadge, { backgroundColor: theme.accent }]}>
          <Icon name="edit" size={20} color={theme.accentText} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: Radius.tile,
    borderWidth: 2,
    borderCurve: 'continuous',
    padding: Spacing.two,
    alignItems: 'center',
  },
  label: {
    marginTop: Spacing.one,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Fonts?.rounded,
  },
  editBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
