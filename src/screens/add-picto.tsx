import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addTile } from '@/store/boards';
import { pictoUrl, type PictoResult, searchPictos } from '@/utils/arasaac';

type Status = 'idle' | 'loading' | 'error' | 'done';

/** Mode aidant: search ARASAAC and add a pictogram to the current board. */
export function AddPicto({ boardId }: { boardId: string }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PictoResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [selected, setSelected] = useState<PictoResult | null>(null);
  const [label, setLabel] = useState('');

  const term = query.trim();
  const searchable = term.length >= 2;

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const found = await searchPictos(term, { signal: controller.signal });
        setResults(found);
        setStatus('done');
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, searchable]);

  function pick(p: PictoResult) {
    setSelected(p);
    setLabel(query.trim() || p.label);
  }

  function save() {
    if (!selected || !label.trim()) return;
    addTile(boardId, { label: label.trim(), pictoId: selected.id });
    router.back();
  }

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }];

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Chercher un mot (ex : piscine)"
        placeholderTextColor={theme.textSecondary}
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Rechercher un pictogramme"
        style={inputStyle}
      />

      {searchable && status === 'loading' && <ActivityIndicator />}
      {searchable && status === 'error' && (
        <Text style={[styles.feedback, { color: theme.danger }]}>
          Recherche impossible. Vérifiez la connexion internet.
        </Text>
      )}
      {searchable && status === 'done' && results.length === 0 && (
        <Text style={[styles.feedback, { color: theme.textSecondary }]}>Aucun pictogramme trouvé.</Text>
      )}

      <FlatList
        data={searchable ? results : []}
        keyExtractor={(p) => String(p.id)}
        numColumns={4}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const active = selected?.id === item.id;
          return (
            <Pressable
              onPress={() => pick(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={[
                styles.result,
                { borderColor: active ? theme.accent : theme.border, borderWidth: active ? 4 : 2 },
              ]}>
              <Image source={pictoUrl(item.id)} style={styles.resultImage} contentFit="contain" />
            </Pressable>
          );
        }}
      />

      {selected && (
        <View style={[styles.confirm, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Image source={pictoUrl(selected.id)} style={styles.preview} contentFit="contain" />
          <View style={styles.confirmBody}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Mot prononcé"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Mot prononcé"
              style={inputStyle}
            />
            <Pressable
              onPress={save}
              disabled={!label.trim()}
              accessibilityRole="button"
              style={[styles.save, { backgroundColor: theme.accent, opacity: label.trim() ? 1 : 0.4 }]}>
              <Text style={[styles.saveText, { color: theme.accentText }]}>Ajouter</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  input: {
    height: 52,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
  },
  feedback: { textAlign: 'center', fontSize: 16 },
  list: { gap: Spacing.two },
  column: { gap: Spacing.two },
  result: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '25%',
    borderRadius: Radius.tile,
    backgroundColor: '#FFFFFF',
    padding: Spacing.one,
  },
  resultImage: { flex: 1 },
  confirm: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 2,
    borderRadius: Radius.bar,
  },
  preview: { width: 96, height: 96, backgroundColor: '#FFFFFF', borderRadius: 12 },
  confirmBody: { flex: 1, gap: Spacing.two },
  save: { height: MinTouch - 12, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 18, fontWeight: '700' },
});
