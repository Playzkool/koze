import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaregiverToggle } from '@/components/caregiver-toggle';
import { Icon } from '@/components/icon';
import { PictoTile } from '@/components/picto-tile';
import { SentenceBar } from '@/components/sentence-bar';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { ROOT_BOARD_ID } from '@/data/default-boards';
import { useTheme } from '@/hooks/use-theme';
import { canCreateCategory, type Tile, useBoard } from '@/store/boards';
import { say } from '@/utils/speech';

const GAP = Spacing.two;

/**
 * Main communication screen. Board navigation is local state (not routes) so
 * switching folders is instant and never animates — predictable for users.
 */
export function BoardScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [path, setPath] = useState<string[]>([ROOT_BOARD_ID]);
  const [sentence, setSentence] = useState<Tile[]>([]);
  const [caregiver, setCaregiver] = useState(false);

  const current = useBoard(path[path.length - 1]);
  const root = useBoard(ROOT_BOARD_ID);
  // A category can disappear under us (e.g. reset from the About screen).
  const board = current ?? root;
  const boardId = board?.id ?? ROOT_BOARD_ID;

  const columns = width >= 900 ? 6 : width >= 600 ? 5 : 3;
  const tileSize = Math.floor((width - Spacing.three * 2 - GAP * (columns - 1)) / columns);

  function pressTile(tile: Tile) {
    Haptics.selectionAsync();
    if (tile.boardId) {
      setPath((p) => [...p, tile.boardId!]);
      return;
    }
    setSentence((s) => [...s, tile]);
    say(tile.speech || tile.label);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <SentenceBar
          words={sentence}
          onSpeak={() => say(sentence.map((w) => w.speech || w.label).join(' '))}
          onBackspace={() => setSentence((s) => s.slice(0, -1))}
          onClear={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSentence([]);
          }}
        />

        <View style={styles.nav}>
          {path.length > 1 ? (
            <Pressable
              onPress={() => setPath((p) => p.slice(0, -1))}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.navRow}>
                <Icon name="back" size={20} color={theme.text} />
                <Text style={[styles.navText, { color: theme.text }]}>Retour</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.navSpacer} />
          )}

          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
            {board?.title ?? ''}
          </Text>

          <CaregiverToggle active={caregiver} onChange={setCaregiver} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} contentInsetAdjustmentBehavior="automatic">
        {board?.tiles.map((tile) => (
          <PictoTile
            key={tile.id}
            tile={tile}
            size={tileSize}
            onPress={() => pressTile(tile)}
            onEdit={
              caregiver
                ? () => router.push({ pathname: '/tile', params: { boardId, tileId: tile.id } })
                : undefined
            }
          />
        ))}

        {/* Pressable + router.push rather than <Link asChild>: Link's Slot rejects style arrays. */}
        {caregiver && (
          <Pressable
            onPress={() => router.push({ pathname: '/tile', params: { boardId } })}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un pictogramme"
            style={[styles.addTile, { width: tileSize, height: tileSize + 28, borderColor: theme.accent }]}>
            <Icon name="add" size={40} color={theme.accent} />
            <Text style={[styles.addLabel, { color: theme.accent }]}>Pictogramme</Text>
          </Pressable>
        )}

        {caregiver && canCreateCategory(boardId) && (
          <Pressable
            onPress={() => router.push({ pathname: '/tile', params: { boardId, category: '1' } })}
            accessibilityRole="button"
            accessibilityLabel="Nouvelle catégorie"
            style={[styles.addTile, { width: tileSize, height: tileSize + 28, borderColor: theme.accent }]}>
            <Icon name="folderAdd" size={40} color={theme.accent} />
            <Text style={[styles.addLabel, { color: theme.accent }]}>Catégorie</Text>
          </Pressable>
        )}
      </ScrollView>

      {caregiver && (
        <View style={[styles.footer, { borderColor: theme.border }]}>
          <Pressable onPress={() => router.push('/about')} accessibilityRole="link" hitSlop={12}>
            <Text style={[styles.footerLink, { color: theme.textSecondary }]}>À propos · Crédits ARASAAC</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // zIndex: the caregiver hint bubble overflows onto the grid.
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two, zIndex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: {
    minWidth: MinTouch,
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSpacer: { minWidth: MinTouch },
  navText: { fontSize: 18, fontWeight: '600' },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  title: { fontSize: 22, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  addTile: {
    borderRadius: Radius.tile,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontSize: 17, fontWeight: '600', marginTop: Spacing.two, textAlign: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.three, alignItems: 'center' },
  footerLink: { fontSize: 15 },
});
