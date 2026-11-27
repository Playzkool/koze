import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { TileImage } from '@/components/tile-image';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tile } from '@/store/boards';

type Props = {
  words: Tile[];
  onSpeak: () => void;
  onBackspace: () => void;
  onClear: () => void;
};

export function SentenceBar({ words, onSpeak, onBackspace, onClear }: Props) {
  const theme = useTheme();
  const empty = words.length === 0;

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        onPress={onSpeak}
        disabled={empty}
        accessibilityRole="button"
        accessibilityLabel={empty ? 'Phrase vide' : `Dire : ${words.map((w) => w.speech || w.label).join(' ')}`}
        style={styles.sentence}>
        {empty ? (
          <Text numberOfLines={3} style={[styles.placeholder, { color: theme.textSecondary }]}>
            Touchez des images pour faire une phrase
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.words}>
            {words.map((w, i) => (
              <View key={`${w.id}-${i}`} style={styles.word}>
                <View style={styles.wordImage}>
                  <TileImage image={w.image} label={w.label} radius={8} textSize={13} />
                </View>
                <Text numberOfLines={1} style={[styles.wordLabel, { color: theme.text }]}>
                  {w.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={onSpeak}
          disabled={empty}
          accessibilityRole="button"
          accessibilityLabel="Parler"
          style={[styles.action, { backgroundColor: theme.accent, opacity: empty ? 0.4 : 1 }]}>
          <Icon name="speak" color={theme.accentText} />
        </Pressable>
        <Pressable
          onPress={onBackspace}
          onLongPress={onClear}
          disabled={empty}
          accessibilityRole="button"
          accessibilityLabel="Effacer le dernier mot"
          accessibilityHint="Appui long pour tout effacer"
          style={[styles.action, { borderColor: theme.border, borderWidth: 2, opacity: empty ? 0.4 : 1 }]}>
          <Icon name="backspace" color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.bar,
    borderCurve: 'continuous',
    borderWidth: 2,
    padding: Spacing.two,
    gap: Spacing.two,
    minHeight: 104,
  },
  sentence: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  words: { alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.one },
  placeholder: { fontSize: 17, paddingHorizontal: Spacing.two },
  word: { alignItems: 'center', width: 68 },
  wordImage: { width: 56, height: 56 },
  wordLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: MinTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
