import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PictoTile } from '@/components/picto-tile';
import { SentenceBar } from '@/components/sentence-bar';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { ROOT_BOARD_ID } from '@/data/default-boards';
import { useTheme } from '@/hooks/use-theme';
import { removeTile, type Tile, useBoard } from '@/store/boards';
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

  const boardId = path[path.length - 1];
  const board = useBoard(boardId);

  const columns = width >= 900 ? 6 : width >= 600 ? 5 : 3;
  const tileSize = Math.floor((width - Spacing.three * 2 - GAP * (columns - 1)) / columns);

  function pressTile(tile: Tile) {
    Haptics.selectionAsync();
    if (tile.boardId) {
      setPath((p) => [...p, tile.boardId!]);
      return;
    }
    setSentence((s) => [...s, tile]);
    say(tile.label);
  }

  function longPressTile(tile: Tile) {
    if (!caregiver) return;
    Alert.alert('Supprimer ce pictogramme ?', tile.label, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeTile(boardId, tile.id) },
    ]);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <SentenceBar
          words={sentence}
          onSpeak={() => say(sentence.map((w) => w.label).join(' '))}
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
              <Text style={[styles.navText, { color: theme.text }]}>‹ Retour</Text>
            </Pressable>
          ) : (
            <View style={styles.navSpacer} />
          )}

          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
            {board?.title ?? ''}
          </Text>

          <Pressable
            // Long press guards against accidental entry by the user.
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setCaregiver((c) => !c);
            }}
            delayLongPress={1200}
            accessibilityRole="button"
            accessibilityLabel={caregiver ? 'Quitter le mode aidant' : 'Mode aidant'}
            accessibilityHint="Appui long"
            style={[
              styles.navButton,
              {
                backgroundColor: caregiver ? theme.accent : theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.navText, { color: caregiver ? theme.accentText : theme.textSecondary }]}>
              {caregiver ? 'Terminé' : '⚙︎'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} contentInsetAdjustmentBehavior="automatic">
        {board?.tiles.map((tile) => (
          <PictoTile
            key={tile.id}
            label={tile.label}
            pictoId={tile.pictoId}
            size={tileSize}
            isFolder={!!tile.boardId}
            removable={caregiver}
            onPress={() => pressTile(tile)}
            onLongPress={() => longPressTile(tile)}
          />
        ))}

        {caregiver && (
          <Link href={{ pathname: '/add', params: { boardId } }} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajouter un pictogramme"
              style={[styles.addTile, { width: tileSize, height: tileSize + 28, borderColor: theme.accent }]}>
              <Text style={[styles.addPlus, { color: theme.accent }]}>＋</Text>
              <Text style={[styles.addLabel, { color: theme.accent }]}>Ajouter</Text>
            </Pressable>
          </Link>
        )}
      </ScrollView>

      {caregiver && (
        <View style={[styles.footer, { borderColor: theme.border }]}>
          <Link href="/about" style={[styles.footerLink, { color: theme.textSecondary }]}>
            À propos · Crédits ARASAAC
          </Link>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two },
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
  addPlus: { fontSize: 40, fontWeight: '300' },
  addLabel: { fontSize: 17, fontWeight: '600' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.three, alignItems: 'center' },
  footerLink: { fontSize: 15 },
});
