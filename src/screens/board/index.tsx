import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Sortable from 'react-native-sortables';

import { CaregiverToggle } from '@/components/caregiver-toggle';
import { Icon } from '@/components/icon';
import { PictoTile } from '@/components/picto-tile';
import { SentenceBar } from '@/components/sentence-bar';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { ROOT_BOARD_ID } from '@/data/default-boards';
import { useTheme } from '@/hooks/use-theme';
import { canCreateCategory, reorderTiles, type Tile, useBoard } from '@/store/boards';
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
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const insets = useSafeAreaInsets();

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

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic">
        <Sortable.Grid
          // Remount per board: switching categories stays instant, with no reorder animation.
          key={boardId}
          data={board?.tiles ?? []}
          keyExtractor={(tile) => tile.id}
          columns={columns}
          rowGap={GAP}
          columnGap={GAP}
          // Reordering is a caregiver action: never drag by accident in user mode.
          sortEnabled={caregiver}
          dragActivationDelay={400}
          hapticsEnabled
          scrollableRef={scrollRef}
          onDragEnd={({ data }) => reorderTiles(boardId, data.map((t) => t.id))}
          renderItem={({ item: tile }) => (
            <PictoTile
              tile={tile}
              size={tileSize}
              onPress={() => pressTile(tile)}
              onEdit={
                caregiver
                  ? () => router.push({ pathname: '/tile', params: { boardId, tileId: tile.id } })
                  : undefined
              }
            />
          )}
        />

        {caregiver && (
          <Text style={[styles.reorderHint, { color: theme.textSecondary }]}>
            Appui long sur une image pour la déplacer.
          </Text>
        )}

        {/* Add tiles stay outside the sortable grid: they always come last. */}
        <View style={styles.addRow}>
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
        </View>
      </Animated.ScrollView>

      {caregiver && (
        <View
          style={[
            styles.footer,
            { borderColor: theme.border, backgroundColor: theme.surface, paddingBottom: Spacing.three + insets.bottom },
          ]}>
          <Pressable
            onPress={() => router.push('/about')}
            accessibilityRole="button"
            accessibilityLabel="Sauvegarde et infos"
            style={({ pressed }) => [
              styles.footerButton,
              { borderColor: theme.accent, backgroundColor: theme.background, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Icon name="share" size={22} color={theme.accent} />
            <Text style={[styles.footerButtonText, { color: theme.accent }]}>Sauvegarde et infos</Text>
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
  content: { padding: Spacing.three, paddingBottom: Spacing.five },
  reorderHint: { fontSize: 14, textAlign: 'center', marginTop: Spacing.three },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: Spacing.three },
  addTile: {
    borderRadius: Radius.tile,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontSize: 17, fontWeight: '600', marginTop: Spacing.two, textAlign: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three, paddingHorizontal: Spacing.three },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: MinTouch - 8,
    borderWidth: 2,
    borderRadius: 28,
  },
  footerButtonText: { fontSize: 18, fontWeight: '700' },
});
